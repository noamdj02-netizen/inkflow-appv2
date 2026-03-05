# Web Push Notifications — InkFlow

## Vue d'ensemble

Les tatoueurs reçoivent des alertes (nouveau RDV, message) même lorsque l'application PWA est fermée.

---

## 1. Générer les clés VAPID

```bash
npx web-push generate-vapid-keys
```

Tu obtiens :
- **Public Key** → `VITE_VAPID_PUBLIC_KEY` dans `.env` (et Vercel)
- **Private Key** → `VAPID_PRIVATE_KEY` dans Supabase Secrets (pour l'Edge Function)

Exemple `.env` :
```
VITE_VAPID_PUBLIC_KEY=BNx...votre_clé_publique...
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

## 3. Envoyer une notification depuis le backend

### Option A : Edge Function Supabase

Installer `web-push` :
```bash
cd supabase/functions
npm init -y
npm install web-push
```

Exemple `send-push-notification/index.ts` :

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import webpush from "web-push";
import { createClient } from "npm:@supabase/supabase-js@2";

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") || "";
webpush.setVapidDetails("mailto:contact@ink-flow.me", VAPID_PUBLIC, VAPID_PRIVATE);

Deno.serve(async (req: Request) => {
  const { studioId, title, body, url } = await req.json();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: subs } = await supabase
    .from("inkflow_push_subscriptions")
    .select("endpoint, keys_p256dh, keys_auth")
    .eq("studio_id", studioId);

  const payload = JSON.stringify({
    title: title || "InkFlow",
    body: body || "Nouvelle notification",
    data: { url: url || "/dashboard" },
  });

  for (const sub of subs || []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
        },
        payload
      );
    } catch (e) {
      if ((e as { statusCode?: number }).statusCode === 410 || (e as { statusCode?: number }).statusCode === 404) {
        await supabase.from("inkflow_push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    }
  }
  return new Response(JSON.stringify({ ok: true }));
});
```

### Option B : Déclencher depuis un trigger ou une autre Edge Function

Quand un nouveau RDV est créé (ex. `inkflow_bookings` INSERT), appelle l'Edge Function :

```typescript
await supabase.functions.invoke("send-push-notification", {
  body: {
    studioId: "...",
    title: "Nouveau rendez-vous",
    body: "Sophie Martin a réservé pour le 15 mars",
    url: "/dashboard?tab=requests",
  },
});
```

---

## 4. Secrets Supabase à configurer

```bash
npx supabase secrets set VAPID_PUBLIC_KEY=BNx...
npx supabase secrets set VAPID_PRIVATE_KEY=...
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
