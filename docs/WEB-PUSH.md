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
- **Public Key** → à mettre dans `.env` / `.env.local` en **`VITE_VAPID_PUBLIC_KEY`** (frontend + Vercel)
- **Private Key** → à mettre dans **Supabase Edge Function Secrets** en **`VAPID_PRIVATE_KEY`** (jamais côté client)

Exemple `.env.local` (côté frontend) :
```
VITE_VAPID_PUBLIC_KEY=BNx...votre_cle_publique...
```

---

## 2. Stockage de l'abonnement dans Supabase

L'abonnement est stocké dans **inkflow_push_subscriptions** :

| Colonne      | Type   | Description                                      |
|-------------|--------|--------------------------------------------------|
| id          | UUID   | Clé primaire                                     |
| studio_id   | TEXT   | Référence inkflow_studios(id)                    |
| endpoint    | TEXT   | URL unique du push (UNIQUE)                     |
| keys_p256dh | TEXT   | Clé publique du client (chiffrement)             |
| keys_auth   | TEXT   | Secret d'authentification                        |
| created_at  | TIMESTAMPTZ | Date de création                            |

**Un studio peut avoir plusieurs abonnements** (téléphone + ordinateur). Chaque appareil crée une ligne.

---

## 3. Edge Function `send-push-notification`

La fonction **`send-push-notification`** est déjà créée dans `supabase/functions/send-push-notification/`.

### Déploiement et secrets

1. Définir les secrets Supabase (clés générées à l’étape 1) :
   ```bash
   npx supabase secrets set VAPID_PUBLIC_KEY=BNx...  VAPID_PRIVATE_KEY=xxx...
   ```
   Ou dans le dashboard : **Project Settings → Edge Functions → Secrets**.

2. Déployer la fonction :
   ```bash
   npx supabase functions deploy send-push-notification
   ```

### Appel depuis le frontend ou une autre Edge Function

```typescript
await supabase.functions.invoke("send-push-notification", {
  body: {
    studioId: "...",
    title: "InkFlow",
    body: "Sophie Martin a réservé pour le 15 mars",
    url: "/dashboard?tab=requests",
    tag: "inkflow-booking",  // optionnel
  },
});
```

---

## 4. Secrets Supabase (récap)

| Secret              | Où le mettre | Description |
|---------------------|--------------|-------------|
| `VAPID_PUBLIC_KEY`  | Supabase Edge Function Secrets | Même clé que `VITE_VAPID_PUBLIC_KEY` (pour la fonction) |
| `VAPID_PRIVATE_KEY`| Supabase Edge Function Secrets | Clé privée (ne jamais l’exposer côté client) |

```bash
npx supabase secrets set VAPID_PUBLIC_KEY=BNx...  VAPID_PRIVATE_KEY=xxx...
```

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

   Remplace `<PROJECT_REF>` par l’ID de ton projet Supabase (ex. `abcdefgh`).

4. Webhooks à créer :

   | Table | Événement | Description |
   |-------|-----------|-------------|
   | `inkflow_bookings` | INSERT | Nouvelle demande RDV vitrine |
   | `inkflow_project_requests` | INSERT | Nouvelle demande de projet |
   | `inkflow_appointments` | INSERT | Nouveau RDV créé |
   | `inkflow_appointments` | UPDATE | Acompte reçu (deposit_paid) |

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
