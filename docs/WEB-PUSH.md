# Web Push Notifications — InkFlow

## Vue d'ensemble

Les tatoueurs reçoivent des alertes (nouveau RDV, message) même lorsque l'application PWA est fermée.

---

## 1. Générer les clés VAPID

À la racine du projet :

```bash
npm run vapid:generate
```

Tu obtiens deux clés (ex. `BNx...` et `xxx...`) :

- **Public Key** → à mettre dans `.env` / `.env.local` en `**VITE_VAPID_PUBLIC_KEY`\*\* (frontend + Vercel)
- **Private Key** → à mettre dans **Supabase Edge Function Secrets** en `**VAPID_PRIVATE_KEY`\*\* (jamais côté client)

Exemple `.env.local` (côté frontend) :

```
VITE_VAPID_PUBLIC_KEY=BNx...votre_cle_publique...
```

---

## 2. Stockage de l'abonnement dans Supabase

L'abonnement est stocké dans **inkflow_push_subscriptions** :

| Colonne     | Type        | Description                          |
| ----------- | ----------- | ------------------------------------ |
| id          | UUID        | Clé primaire                         |
| studio_id   | TEXT        | Référence inkflow_studios(id)        |
| endpoint    | TEXT        | URL unique du push (UNIQUE)          |
| keys_p256dh | TEXT        | Clé publique du client (chiffrement) |
| keys_auth   | TEXT        | Secret d'authentification            |
| created_at  | TIMESTAMPTZ | Date de création                     |

**Un studio peut avoir plusieurs abonnements** (téléphone + ordinateur). Chaque appareil crée une ligne.

---

## 3. Edge Function `send-push-notification`

La fonction `**send-push-notification`\*\* est déjà créée dans `supabase/functions/send-push-notification/`.

### Déploiement et secrets

1. Définir les secrets Supabase (clés générées à l’étape 1) :

```bash
 npx supabase secrets set VAPID_PUBLIC_KEY=BNx...  VAPID_PRIVATE_KEY=xxx...
```

Ou dans le dashboard : **Project Settings → Edge Functions → Secrets**. 2. Déployer la fonction :

```bash
 npx supabase functions deploy send-push-notification
```

### Appel depuis le frontend ou une autre Edge Function

```typescript
await supabase.functions.invoke('send-push-notification', {
  body: {
    studioId: '...',
    title: 'InkFlow',
    body: 'Sophie Martin a réservé pour le 15 mars',
    url: '/dashboard?tab=requests',
    tag: 'inkflow-booking', // optionnel
  },
});
```

---

## 4. Secrets Supabase (récap)

| Secret              | Où le mettre                   | Description                                                           |
| ------------------- | ------------------------------ | --------------------------------------------------------------------- |
| `VAPID_PUBLIC_KEY`  | Supabase Edge Function Secrets | Même clé que `VITE_VAPID_PUBLIC_KEY` (pour la fonction)               |
| `VAPID_PRIVATE_KEY` | Supabase Edge Function Secrets | Clé privée (ne jamais l’exposer côté client)                          |
| `EXPO_ACCESS_TOKEN` | Supabase Edge Function Secrets | Optionnel ; Bearer Expo pour `exp.host` (push vers jetons Expo shell) |

```bash
npx supabase secrets set VAPID_PUBLIC_KEY=BNx...  VAPID_PRIVATE_KEY=xxx...
# Optionnel — app enveloppe Expo :
npx supabase secrets set EXPO_ACCESS_TOKEN=xxx...
```

---

## 4bis. App Expo « Inkflow Pro » (WebView + Expo Push)

Le Web Push **VAPID** dans une WebView iOS/Android n’est pas fiable ; l’app **`inkflow-mobile/`** enregistre un **jeton Expo** (`ExponentPushToken[…]`) et le rattache au studio.

| Étape         | Détail                                                                                                                                                                                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Migration** | Colonne `studio_id` sur `inkflow_native_device_tokens` (voir migration `*_native_device_studio_id.sql`).                                                                                                                                                         |
| **Front web** | User-Agent enrichi avec `InkflowProShell` ; le dashboard envoie `postMessage({ type: 'inkflow_native_push_register', accessToken, studioId })` via `useInkflowNativeShellPushBridge`.                                                                            |
| **Mobile**    | `WebAppShell.tsx` : `onMessage` → `register-native-device` avec JWT + `studio_id`. Variable **`EXPO_PUBLIC_SUPABASE_URL`** (même projet que le web) dans **EAS Secrets** ou `.env` Expo pour que `fetch` atteigne `/functions/v1/register-native-device`.        |
| **Edge**      | `send-push-notification` envoie aussi vers `https://exp.host/--/api/v2/push/send` pour les lignes où `studio_id` est renseigné. Secret optionnel **`EXPO_ACCESS_TOKEN`** (Expo → Access tokens). Sans VAPID, seuls les jetons Expo peuvent recevoir des alertes. |

Déployer aussi la fonction **`register-native-device`** après modification du corps JSON (`studio_id`).

---

## 5. Notifications quand l'app est fermée (Database Webhooks)

Pour recevoir des push **même quand l'app est fermée (mobile ou desktop)**, il faut configurer des **Database Webhooks** qui déclenchent l'Edge Function `notification-webhook` à chaque INSERT/UPDATE pertinent.

### Déployer et configurer

1. Déployer la fonction :

```bash
 npx supabase functions deploy notification-webhook
 npx supabase functions deploy send-push-notification
```

2. Créer les webhooks dans **Supabase Dashboard** : **Database → Webhooks** (ou **Project Settings → Integrations → Webhooks**).
3. Pour chaque webhook ci-dessous, utiliser l’URL :

```
 https://<PROJECT_REF>.supabase.co/functions/v1/notification-webhook
```

Remplace `<PROJECT_REF>` par l’ID de ton projet Supabase (ex. `abcdefgh`). 4. Webhooks à créer :

| Table                      | Événement | Description                  |
| -------------------------- | --------- | ---------------------------- |
| `inkflow_bookings`         | INSERT    | Nouvelle demande RDV vitrine |
| `inkflow_project_requests` | INSERT    | Nouvelle demande de projet   |
| `inkflow_appointments`     | INSERT    | Nouveau RDV créé             |
| `inkflow_appointments`     | UPDATE    | Acompte reçu (deposit_paid)  |

5. Les paiements Stripe déclenchent déjà un push directement depuis le webhook Stripe (pas besoin de webhook DB sur `inkflow_notifications`).

### Résumé

- **App ouverte** : Realtime + Web Notifications (navigateur).
- **App fermée** : Database Webhooks → `notification-webhook` → `send-push-notification` → push sur le device.

---

## 6. Format du payload push

Le Service Worker attend un JSON :

```json
{
  "title": "InkFlow",
  "body": "Nouveau rendez-vous — Sophie Martin",
  "tag": "inkflow-booking",
  "data": {
    "url": "/dashboard?tab=requests",
    "actionUrl": "/dashboard"
  },
  "requireInteraction": false
}
```

- `data.url` : ouverture au clic sur la notification
- `tag` : regroupe les notifications (une seule affichée par tag)

---

## 7. Activation côté utilisateur

Le tatoueur active les notifications push dans **Paramètres → Notifications** (section « Notifications push »). Il doit :

1. Utiliser HTTPS (ou localhost en dev)
2. Installer l’app en PWA (Add to Home Screen sur mobile)
3. Accepter la permission « Notifications » dans le navigateur
4. Avoir `VITE_VAPID_PUBLIC_KEY` configuré dans le build frontend

### iPhone / iPad (Safari, iOS 16.4+)

- Les **Web Push** ne sont pris en charge que pour l’app **installée sur l’écran d’accueil** (pas dans un onglet Safari classique).
- Ouvrir InkFlow **depuis l’icône** sur l’écran d’accueil, puis **Paramètres → Notifications → Activer les notifications** : la demande système doit passer par un **geste utilisateur** (bouton). L’app ne demande plus la permission automatiquement en arrière-plan sur iOS (comportement WebKit).
- Après réinstallation de la PWA, réautoriser les notifications et vérifier **Réglages iOS → Notifications → [InkFlow]** si besoin.

---

## 8. Web Push (VAPID) vs FCM / Expo

| Technologie                        | Contexte InkFlow                                                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Web Push + VAPID**               | Abonnements dans `inkflow_push_subscriptions`, clés `VAPID_*`. Fonctionne dans le **navigateur** / PWA installée.            |
| **Firebase Cloud Messaging (FCM)** | Push natif Android « pur » — **non utilisé** directement dans ce dépôt ; Expo peut router vers FCM sous le capot.            |
| **Expo Push**                      | Utilisé par l’app **`inkflow-mobile`** (WebView + jetons Expo enregistrés dans `inkflow_native_device_tokens`). Voir § 4bis. |

Une **notification de bienvenue au moment du clic sur le lien de confirmation d’email** reste peu réaliste sur le web tant que l’utilisateur n’a pas encore accepté les notifications dans le navigateur.

**Activation** : Web — **Paramètres → Notifications** (PWA / Safari installée sur iOS). Shell Expo — permission demandée au premier message bridge `inkflow_native_push_register` depuis le dashboard (voir § 4bis).

---

## 9. Push natif / Expo (jetons hors Web Push VAPID)

Pour l’app enveloppe **Expo** (`inkflow-mobile`), les jetons **Expo Push** ne passent pas par `inkflow_push_subscriptions`. Ils sont stockés dans **`inkflow_native_device_tokens`** (`user_id`, `studio_id`, `token`, `platform`, `updated_at`), avec RLS côté utilisateur.

### Edge Function `register-native-device`

- **POST** `/functions/v1/register-native-device`
- **Headers** : `Authorization: Bearer <JWT utilisateur>` (session Supabase Auth)
- **Body JSON** : `{ "token": "<ExponentPushToken…>", "platform": "ios" | "android" | …, "studio_id": "<studio uuid>" }` (alias accepté : `studioId`)
- **Réponse** : `{ "ok": true }`

L’envoi est traité par **`send-push-notification`** via l’API Expo (`exp.host`) lorsque **`EXPO_ACCESS_TOKEN`** est défini ; sinon seuls les abonnements Web Push VAPID partent (si configurés).

```bash
npx supabase functions deploy register-native-device
```
