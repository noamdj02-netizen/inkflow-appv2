# Variables d'environnement — Production InkFlow

## Règle : rien de secret côté frontend

Le build Vite n’a accès qu’aux variables **préfixées par `VITE_`**. Tout le reste doit rester **côté serveur** (Edge Functions Supabase, Vercel serverless, etc.).

---

## Variables publiques (frontend — préfixe `VITE_`)

À définir dans **`.env.local`** (et dans **Vercel** → Project → Settings → Environment Variables pour le build).

| Variable | Description | Exemple |
|--------|-------------|--------|
| `VITE_SUPABASE_URL` | URL du projet Supabase | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme (publique) Supabase | `eyJhbGc...` |
| `VITE_GEMINI_API_KEY` | Clé API Google Gemini (optionnel, pour l’assistant IA) | (optionnel) |
| `VITE_SENTRY_DSN` | DSN Sentry pour le monitoring (optionnel) | `https://xxx@xxx.ingest.sentry.io/xxx` |

**Important :** n’utilise **jamais** en frontend :
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Toute clé d’API secrète (Resend, etc.)

---

## Variables secrètes (Edge Functions Supabase uniquement)

À configurer dans **Supabase Dashboard** → Project Settings → Edge Functions → Secrets (ou `supabase secrets set`).

| Variable | Utilisée par | Description |
|----------|--------------|-------------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Frontend (Vercel) | Clé publique Stripe `pk_live_xxx` (optionnel) |
| `STRIPE_SECRET_KEY` | create-checkout-session, create-subscription | Clé secrète Stripe (mode Live en prod) |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook | Secret de signature du webhook Stripe (obligatoire en prod) |
| `SUPABASE_URL` | Toutes les Edge Functions | Injectée automatiquement par Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | stripe-webhook, create-checkout-session, etc. | Injectée automatiquement par Supabase |
| `SITE_URL` | create-checkout-session, create-subscription | URL de production (ex. `https://inkflow.app`) pour success_url / cancel_url |
| `RESEND_API_KEY` | send-project-notification, send-aftercare-email, send-appointment-reminders, send-referral-notification | Envoi d’emails (Resend) |
| `GEMINI_API_KEY` | (si utilisé côté Edge Function) | Optionnel |
| `META_APP_ID` | instagram | ID de l'app Meta (developers.facebook.com) |
| `META_APP_SECRET` | instagram | Secret de l'app Meta |
| `META_WEBHOOK_VERIFY_TOKEN` | instagram-webhook | Token de vérification du webhook Meta |
| `GOOGLE_PLACES_API_KEY` ou `GOOGLE_MAPS_API_KEY` | `google-places` | Clé Places API (avis vitrine + recherche établissement) — **jamais** en `VITE_` |

En **production** :
- Définir **obligatoirement** `STRIPE_WEBHOOK_SECRET` (sinon le webhook renvoie 501).
- Définir `SITE_URL` sur l’URL réelle (pas localhost) pour que les redirections Stripe pointent vers ton domaine.

---

## Déploiement du webhook Stripe

**Important** : Le webhook Stripe doit être déployé sans vérification JWT car Stripe ne peut pas envoyer de token Supabase.

```bash
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

### Edge Function `google-places` (avis publics sans JWT)

L’action `public_reviews` est appelée depuis la vitrine sans session. Déployer avec :

```bash
npx supabase functions deploy google-places --no-verify-jwt
```

Configurer le secret `GOOGLE_PLACES_API_KEY` (ou `GOOGLE_MAPS_API_KEY`) dans Supabase.

### Configurer le webhook dans Stripe Dashboard

1. Aller sur [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Cliquer sur "Add endpoint"
3. URL : `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
4. Événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copier le "Signing secret" (commence par `whsec_`)
6. L'ajouter comme secret Supabase : `STRIPE_WEBHOOK_SECRET`

---

## Vérification rapide

- **Frontend (Vite)** : seules `import.meta.env.VITE_*` sont utilisées (voir `lib/supabase.ts`, `lib/geminiAI.ts`, `contexts/AuthContext.tsx`, etc.).
- **Edge Functions** : les clés Stripe, Resend, etc. sont lues via `Deno.env.get("...")` et ne sont jamais exposées au client.

---

## Checklist de déploiement MVP (29 mars)

### Supabase Secrets (obligatoires)
- [ ] `STRIPE_SECRET_KEY` — clé live `sk_live_...`
- [ ] `STRIPE_WEBHOOK_SECRET` — copié depuis Stripe Dashboard
- [ ] `SITE_URL` — `https://ink-flow.me`
- [ ] `RESEND_API_KEY` — pour les emails

### Vercel Environment Variables (obligatoires)
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`

### Stripe Dashboard
- [ ] Créer le webhook endpoint en mode Live
- [ ] Copier le signing secret vers Supabase

### Déploiement Edge Functions
```bash
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy create-checkout-session
npx supabase functions deploy create-subscription
npx supabase functions deploy create-portal-session
npx supabase functions deploy get-payment-session
```
