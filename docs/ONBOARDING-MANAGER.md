# Onboarding Manager InkFlow

Automatisation **0 % → actif** : e-mails (Resend), jalons `inkflow_user_settings`, alertes founder.

## Jalons produit

| Canal | Rôle |
|--------|------|
| Edge `send-tattooer-welcome` | Bienvenue à chaud après login / validation compte (JWT). Met `onboarding_welcome_sent_at`. |
| Edge `onboarding-automation` | Relances 24 h / 48 h / 72 h, réactivation ~14 j, félicitations 1er booking. **Cron uniquement** (`POST` + secret). |

## Déploiement

```bash
npm run deploy:function:send-tattooer-welcome
npm run deploy:function:onboarding-automation
```

Secrets Supabase (Edge) : `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`, `EDGE_CRON_SECRET`, `APP_URL` (liens dans les mails).

`supabase/config.toml` : `[functions.onboarding-automation] verify_jwt = false`.

## Cron

Appeler `POST /functions/v1/onboarding-automation` avec header :

`x-cron-secret: <EDGE_CRON_SECRET>`

Exemple **pg_net** (Supabase) : requête HTTP planifiée 1×/jour ou 2×/jour. Alternative : cron Vercel qui tape la même URL.

## Base

Migration `20260420120000_onboarding_automation_email_tracking.sql` : timestamps d’idempotence sur `inkflow_user_settings`.

## Dashboard studio

- `components/dashboard/StudioSetupChecklist.tsx` — barre **%** via `computeDashboardActivationPercent` (`lib/onboardingMetrics.ts`).
- Funnel 4 piliers (profil / flash / Stripe / booking) : `computeActivationPercent` (pour exports / analytics).

## Rapport founder

Edge `admin-founder-metrics` expose entre autres `alerts.studiosNoFlashAfter48h` et `alerts.studiosNoStripeAfter72h` (cohorte 365 j).
