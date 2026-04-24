# Auth renforcée (P0.4)

Checklist opérationnelle et limites connues pour l’authentification InkFlow (SPA Vite + Supabase).

## Secrets Supabase (Edge Functions)

| Secret                                 | Rôle                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL`               | Rate limiting distribué (`send-studio-auth-link`, `send-password-recovery`)        |
| `UPSTASH_REDIS_REST_TOKEN`             |                                                                                    |
| `TURNSTILE_SECRET_KEY`                 | Vérification Cloudflare Turnstile (pair avec `VITE_TURNSTILE_SITE_KEY` côté build) |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | E-mails magic link, recovery, etc.                                                 |

Sans Upstash, les Edge Functions **n’appliquent pas** de limite de débit (à corriger en production).

## Variables Vite (Vercel)

| Variable                  | Rôle                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_TURNSTILE_SITE_KEY` | (Optionnel) Widget Turnstile sur login / inscription e-mail. **Obligatoire** d’ajouter `TURNSTILE_SECRET_KEY` sur Supabase pour le même site Turnstile. |

## Dashboard Supabase

1. **Authentication → Providers → Email** : activer **Confirm email** pour les comptes mot de passe.
2. **Authentication → URL configuration** : `Site URL` = origine de l’app (ex. `https://app.ink-flow.me`). **Redirect URLs** : inclure `/reset-password`, `/auth/callback`, etc. (voir `.env.example`).
3. **Authentication → Settings** : vérifier une **JWT expiry** raisonnable (souvent 1 h pour l’access token) — **éviter une durée type 1 an**. Le refresh est géré par le client (`lib/supabase.ts` : `autoRefreshToken: true`, `persistSession: true`).
4. **Attack Protection / Captcha** (selon offre Supabase) : complément utile pour les attaques automatisées sur `signInWithPassword` / `signUp` (les requêtes vont directement à GoTrue ; le middleware Next.js ne s’applique pas à ce trafic).

## Comportement applicatif

- **Déconnexion** : `supabase.auth.signOut({ scope: 'global' })` pour révoquer la session côté serveur.
- **Reset mot de passe** : le client appelle l’Edge `send-password-recovery` (Resend + rate limit), pas `resetPasswordForEmail` direct.
- **Garde-fou e-mail** : si une session a le provider `email` sans `email_confirmed_at`, l’app force une déconnexion et peut afficher le bandeau « vérifie ta boîte » sur `/login` via `sessionStorage` (`INKFLOW_EMAIL_UNVERIFIED_KEY`).

## Test manuel E2E — réinitialisation mot de passe

1. Configurer Resend + secrets Edge ; déployer `send-password-recovery`.
2. Aller sur `/reset-password`, saisir un compte existant.
3. Ouvrir l’e-mail → lien → atterrir sur `/auth/update-password` (ou `/reset-password` avec hash puis redirection).
4. Définir un nouveau mot de passe, puis `/login` avec le nouveau mot de passe.

## Limites

- **Brute force sur le login** : le rate limit Upstash ne s’applique qu’aux **Edge Functions** appelées explicitement. Pour le couple e-mail / mot de passe, combiner **Turnstile**, **Attack Protection** Supabase si disponible, et bonnes durées JWT.

## Déploiement des nouvelles fonctions

```bash
npx supabase functions deploy send-password-recovery --no-verify-jwt
npx supabase functions deploy verify-turnstile --no-verify-jwt
npx supabase functions deploy send-studio-auth-link --no-verify-jwt
```

Secrets : `supabase secrets set UPSTASH_REDIS_REST_URL=...` (et token, Turnstile, etc.).
