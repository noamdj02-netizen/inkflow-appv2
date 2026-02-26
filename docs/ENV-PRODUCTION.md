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
| `STRIPE_SECRET_KEY` | create-checkout-session, create-subscription | Clé secrète Stripe (mode Live en prod) |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook | Secret de signature du webhook Stripe (obligatoire en prod) |
| `SUPABASE_URL` | Toutes les Edge Functions | Injectée automatiquement par Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | stripe-webhook, create-checkout-session, etc. | Injectée automatiquement par Supabase |
| `SITE_URL` | create-checkout-session, create-subscription | URL de production (ex. `https://inkflow.app`) pour success_url / cancel_url |
| `RESEND_API_KEY` | send-project-notification, send-aftercare-email, send-appointment-reminders | Envoi d’emails (Resend) |
| `GEMINI_API_KEY` | (si utilisé côté Edge Function) | Optionnel |

En **production** :
- Définir **obligatoirement** `STRIPE_WEBHOOK_SECRET` (sinon le webhook renvoie 501).
- Définir `SITE_URL` sur l’URL réelle (pas localhost) pour que les redirections Stripe pointent vers ton domaine.

---

## Vérification rapide

- **Frontend (Vite)** : seules `import.meta.env.VITE_*` sont utilisées (voir `lib/supabase.ts`, `lib/geminiAI.ts`, `contexts/AuthContext.tsx`, etc.).
- **Edge Functions** : les clés Stripe, Resend, etc. sont lues via `Deno.env.get("...")` et ne sont jamais exposées au client.
