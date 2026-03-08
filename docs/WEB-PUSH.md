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

## 5. Format du payload push

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
