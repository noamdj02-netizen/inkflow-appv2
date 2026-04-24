# Variables d'environnement — Production InkFlow

**Sauvegardes / sinistre (hors Vercel) :** pour un dump Postgres manuel ou automatisé, voir [BACKUP-RECOVERY-DR.md](BACKUP-RECOVERY-DR.md) et le script `scripts/backup-postgres.sh` (variable locale **`DATABASE_URL` uniquement**, jamais dans le dépôt).

**Sentry, uptime, Vercel logs :** [MONITORING-P0.md](MONITORING-P0.md) — en prod, `VITE_SENTRY_DSN` sur Vercel ; alertes e-mail côté Sentry ; outil d’uptime externe. Pour d’éventuels **builds Next** dans ce repo, `SENTRY_DSN` (sans `VITE_`) pour `sentry.*.config.ts` (non utilisé par le build Vite principal).

## Règle : rien de secret côté frontend

Le build Vite n’a accès qu’aux variables **préfixées par `VITE_`**. Tout le reste doit rester **côté serveur** (Edge Functions Supabase, Vercel serverless, etc.).

---

## Variables publiques (frontend — préfixe `VITE_`)

À définir dans `**.env.local`** (et dans **Vercel\*\* → Project → Settings → Environment Variables pour le build).

| Variable                      | Description                                                                                      | Exemple                                                                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`           | URL du projet Supabase                                                                           | `https://xxxx.supabase.co`                                                                                                                                                                                                                      |
| `VITE_SUPABASE_ANON_KEY`      | Clé anonyme (publique) Supabase                                                                  | `eyJhbGc...`                                                                                                                                                                                                                                    |
| `VITE_GEMINI_API_KEY`         | Clé API Google Gemini (optionnel, pour l’assistant IA)                                           | (optionnel)                                                                                                                                                                                                                                     |
| `VITE_SENTRY_DSN`             | DSN Sentry pour le monitoring (optionnel)                                                        | `https://xxx@xxx.ingest.sentry.io/xxx`                                                                                                                                                                                                          |
| `VITE_TURNSTILE_SITE_KEY`     | (Optionnel) Cloudflare Turnstile sur login / inscription. Avec `TURNSTILE_SECRET_KEY` côté Edge. | Voir [AUTH-HARDENING.md](AUTH-HARDENING.md)                                                                                                                                                                                                     |
| `VITE_APPLE_WALLET_PASS_URL`  | (Optionnel) URL vers un pass .pkpass ou endpoint. Placeholder `{code}`.                          | `https://api.example.com/wallet/apple?code={code}`                                                                                                                                                                                              |
| `VITE_GOOGLE_WALLET_SAVE_URL` | (Optionnel) URL Save to Google Wallet (JWT backend). Placeholder `{code}`.                       | Voir Google Wallet API                                                                                                                                                                                                                          |
| `VITE_GOOGLE_MAPS_JS_API_KEY` | Carte Google Maps (client + dashboard), géocodage côté navigateur                                | Clé navigateur avec **Maps JavaScript API** activée ; facturation GCP ; restrictions **HTTP referrer** (ex. `http://localhost:`_, `https://votre-domaine/`_). `VITE_GOOGLE_MAPS_API_KEY` est accepté en secours si la clé JS n’est pas définie. |

Sans ces variables, les boutons Wallet utilisent partage ou copie du code + lien d’invitation.

**Google Maps (erreur « ne s’est pas chargé correctement »)** : en général clé absente au mauvais nom, clé invalide, **Maps JavaScript API** non activée, facturation GCP inactive, ou domaine non autorisé dans les restrictions de la clé. Vérifier la console JavaScript pour le code d’erreur Google.

**Important :** n’utilise **jamais** en frontend :

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Toute clé d’API secrète (Resend, etc.)

**Contrôles locaux :** `npm run qa:audit-vite` (détection de motifs secrets dans les valeurs `VITE_`\* de `.env.local`). Sur Vercel, refaire la revue manuelle des variables. Pour les **source maps Sentry** au build : `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` (sans `VITE_`), puis `npm run qa:sentry-build` et vérification dans Sentry → **Releases** / **Source Maps**.

### Vercel — Daily Brief (cron + API, sans préfixe `VITE_`)

| Variable                    | Obligatoire      | Description                                                                                            |
| --------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------ |
| `CRON_SECRET`               | pour le cron     | Secret partagé : header `Authorization: Bearer <CRON_SECRET>` sur `GET /api/cron/daily-brief`          |
| `SUPABASE_SERVICE_ROLE_KEY` | oui côté serveur | Même clé qu’en Edge (déjà souvent en variable Vercel pour d’autres besoins)                            |
| `DAILY_BRIEF_STUDIO_ID`     | non              | UUID `inkflow_studios` : push Web quotidien vers les abonnements de ce studio                          |
| `INSTAGRAM_ACCESS_TOKEN`    | non              | Insights Instagram (si configuré)                                                                      |
| `FOUNDER_ADMIN_EMAILS`      | recommandé       | E-mails autorisés pour `GET /api/daily-brief` si le compte n’est pas en `@ink-flow.me` / `@inkflow.me` |

Voir `docs/inkflow-daily-brief.md`.

---

## Variables secrètes (Edge Functions Supabase uniquement)

À configurer dans **Supabase Dashboard** → Project Settings → Edge Functions → Secrets (ou `supabase secrets set`).

| Variable                                         | Utilisée par                                                                                                                                               | Description                                                                                                                                                                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_STRIPE_PUBLISHABLE_KEY`                    | Frontend (Vercel)                                                                                                                                          | Clé publique Stripe `pk_live_xxx` (optionnel)                                                                                                                                                                          |
| `STRIPE_SECRET_KEY`                              | create-checkout-session, create-subscription, stripe-connect-onboarding                                                                                    | Clé secrète **plateforme** Stripe (`sk_live_…`) — Connect activé sur le compte plateforme                                                                                                                              |
| `SUPABASE_ANON_KEY`                              | stripe-connect-onboarding                                                                                                                                  | Même clé que `VITE_SUPABASE_ANON_KEY` — vérification JWT utilisateur (injectée par Supabase si non définie)                                                                                                            |
| `INKFLOW_CONNECT_APPLICATION_FEE_BPS`            | create-checkout-session (optionnel)                                                                                                                        | Commission plateforme en **basis points** (100 = 1 %). `0` = tout pour le studio connecté                                                                                                                              |
| `STRIPE_CONNECT_COUNTRY`                         | stripe-connect-onboarding (optionnel)                                                                                                                      | Pays du compte Express (`FR` par défaut)                                                                                                                                                                               |
| `STRIPE_WEBHOOK_SECRET`                          | stripe-webhook                                                                                                                                             | Secret de signature du webhook Stripe (obligatoire en prod)                                                                                                                                                            |
| `SENTRY_DSN`                                     | stripe-webhook (optionnel)                                                                                                                                 | Même projet Sentry que le front ou projet dédié « Edge » — erreurs DB / exceptions webhook                                                                                                                             |
| `SENTRY_ENVIRONMENT`                             | stripe-webhook (optionnel)                                                                                                                                 | Surcharge du tag `environment` (défaut : `production`)                                                                                                                                                                 |
| `SUPABASE_URL`                                   | Toutes les Edge Functions                                                                                                                                  | Injectée automatiquement par Supabase                                                                                                                                                                                  |
| `SUPABASE_SERVICE_ROLE_KEY`                      | stripe-webhook, create-checkout-session, etc.                                                                                                              | Injectée automatiquement par Supabase                                                                                                                                                                                  |
| `SITE_URL`                                       | create-checkout-session, create-subscription                                                                                                               | URL de production (ex. `https://inkflow.app`) pour success_url / cancel_url                                                                                                                                            |
| `RESEND_API_KEY`                                 | send-project-notification, send-aftercare-email, send-appointment-reminders, send-referral-notification, `send-studio-auth-link`, `send-password-recovery` | Envoi d’emails (Resend)                                                                                                                                                                                                |
| `UPSTASH_REDIS_REST_URL`                         | `send-studio-auth-link`, `send-password-recovery`                                                                                                          | URL REST Upstash (rate limit auth) — **recommandé en production**                                                                                                                                                      |
| `UPSTASH_REDIS_REST_TOKEN`                       | idem                                                                                                                                                       | Token Upstash                                                                                                                                                                                                          |
| `TURNSTILE_SECRET_KEY`                           | `verify-turnstile`                                                                                                                                         | Secret serveur **Cloudflare Turnstile** (pair avec `VITE_TURNSTILE_SITE_KEY` côté Vite) — voir [docs/AUTH-HARDENING.md](AUTH-HARDENING.md)                                                                             |
| `RESEND_FROM_EMAIL`                              | (optionnel)                                                                                                                                                | Adresse d’envoi (défaut `InkFlow <contact@ink-flow.me>`)                                                                                                                                                               |
| `RESEND_REPLY_TO`                                | `sendEmail`, `sendWithTemplate`                                                                                                                            | **Réponse** : boîte qui reçoit les réponses (défaut `contact@ink-flow.me` si oubli)                                                                                                                                    |
| `RESEND_WEBHOOK_SECRET`                          | `resend-webhook`                                                                                                                                           | Secret de signature **Svix** (dashboard Resend → Webhooks) pour bounces / plaintes → `email_suppressions`                                                                                                              |
| `EMAIL_UNSUBSCRIBE_SECRET`                       | `email-marketing-unsubscribe`, e-mails J+1/J+7/J+30, parrainage (List-Unsubscribe)                                                                         | HMAC liens de désinscription (longue chaîne aléatoire)                                                                                                                                                                 |
| `GEMINI_API_KEY`                                 | (si utilisé côté Edge Function)                                                                                                                            | Optionnel                                                                                                                                                                                                              |
| `META_APP_ID`                                    | instagram                                                                                                                                                  | ID de l'app Meta (developers.facebook.com)                                                                                                                                                                             |
| `META_APP_SECRET`                                | instagram                                                                                                                                                  | Secret de l'app Meta                                                                                                                                                                                                   |
| `META_WEBHOOK_VERIFY_TOKEN`                      | instagram-webhook                                                                                                                                          | Token de vérification du webhook Meta                                                                                                                                                                                  |
| `GOOGLE_PLACES_API_KEY` ou `GOOGLE_MAPS_API_KEY` | `google-places`                                                                                                                                            | Clé Places API (avis vitrine + recherche établissement) — **jamais** en `VITE`\_. Dans Google Cloud : activer **Places API** (legacy) et/ou **Places API (New)** ; la fonction tente les deux pour la recherche texte. |

En **production** :

- Définir **obligatoirement** `STRIPE_WEBHOOK_SECRET` (sinon le webhook renvoie 501).
- Définir `SITE_URL` sur l’URL réelle (pas localhost) pour que les redirections Stripe pointent vers ton domaine.

---

## Déploiement du webhook Stripe

**Important** : Le webhook Stripe doit être déployé sans vérification JWT car Stripe ne peut pas envoyer de token Supabase.

```bash
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

Pour le monitoring des erreurs côté webhook (recommandé) : `supabase secrets set SENTRY_DSN=…` (même DSN que `VITE_SENTRY_DSN` ou DSN projet serveur), puis redéployer la fonction.

### Stripe Connect (acomptes vers le compte de chaque studio)

1. Dans le [Dashboard Stripe](https://dashboard.stripe.com) (compte **plateforme**), activer **Connect** et choisir le modèle (Express recommandé pour ce flux).
2. Webhook : ajouter l’événement `**account.updated`\*\* sur l’endpoint qui pointe vers `stripe-webhook` (mise à jour `stripe_connect_charges_enabled` en base).
3. Déployer les fonctions :

```bash
npx supabase functions deploy create-checkout-session
npx supabase functions deploy stripe-connect-onboarding
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

`stripe-connect-onboarding` **garde la vérification JWT** (utilisateur connecté uniquement). Les tatoueurs ouvrent **Paramètres → Paiements → Connecter mon compte Stripe** pour l’onboarding Express.

### Edge Function `google-places` (avis publics sans JWT)

L’action `public_reviews` est appelée depuis la vitrine sans session. Déployer avec :

```bash
npx supabase functions deploy google-places --no-verify-jwt
```

Configurer le secret `GOOGLE_PLACES_API_KEY` (ou `GOOGLE_MAPS_API_KEY`) dans Supabase.

**Erreur navigateur « Failed to send a request to the Edge Function »** : en général la fonction n’est pas déployée, le secret Google manque, ou **CORS** : le fichier partagé `supabase/functions/_shared/cors.ts` autorise désormais tout origine **HTTPS** valide ; après modification, redéployer au moins `google-places` pour prendre effet.

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

- **Frontend (Vite)** : seules `import.meta.env.VITE_`\* sont utilisées (voir `lib/supabase.ts`, `lib/geminiAI.ts`, `contexts/AuthContext.tsx`, etc.).
- **Edge Functions** : les clés Stripe, Resend, etc. sont lues via `Deno.env.get("...")` et ne sont jamais exposées au client.

---

## Checklist de déploiement MVP (29 mars)

### Supabase Secrets (obligatoires)

- `STRIPE_SECRET_KEY` — clé live `sk_live_...`
- `STRIPE_WEBHOOK_SECRET` — copié depuis Stripe Dashboard
- `SITE_URL` — `https://ink-flow.me`
- `RESEND_API_KEY` — pour les emails

### Vercel Environment Variables (obligatoires)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Stripe Dashboard

- Créer le webhook endpoint en mode Live
- Copier le signing secret vers Supabase

### Déploiement Edge Functions

```bash
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy create-checkout-session
npx supabase functions deploy create-subscription
npx supabase functions deploy create-portal-session
npx supabase functions deploy get-payment-session
```
