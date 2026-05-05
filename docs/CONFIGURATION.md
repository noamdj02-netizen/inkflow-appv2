# Configuration InkFlow — Guide complet

Ce guide liste toutes les étapes pour rendre InkFlow opérationnel en production.

---

## 1. Variables d'environnement

### 1.1 Fichier `.env.local` (développement local)

Copiez `.env.example` en `.env.local` :

```bash
cp .env.example .env.local
```

Remplissez au minimum :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.2 Vercel (production)

Dans **Vercel Dashboard → Votre projet → Settings → Environment Variables** :

| Variable                 | Valeur                     | Environnement       |
| ------------------------ | -------------------------- | ------------------- |
| `VITE_SUPABASE_URL`      | URL Supabase               | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | Clé anon Supabase          | Production, Preview |
| `VITE_GEMINI_API_KEY`    | Clé API Gemini (optionnel) | Production, Preview |

---

## 2. Supabase

### 2.1 Créer le projet

1. [supabase.com](https://supabase.com) → New Project
2. Notez l’**URL** et la **clé anon** (Settings → API)

### 2.2 Base de données

1. **SQL Editor** → New query
2. Copiez-collez le contenu de `docs/SUPABASE_BOOTSTRAP.sql`
3. Exécutez

### 2.3 Auth

1. **Authentication → Providers** : activez **Email** et **Google**
2. **Authentication → Sign In / Providers → Email** : si **Confirm email** est activé (recommandé en prod), Supabase envoie un lien de confirmation. Sinon l’utilisateur reçoit une session immédiatement **sans** e-mail de confirmation.
3. **Authentication → URL Configuration** (indispensable pour que le mail parte et que le lien fonctionne) :

- **Site URL** : origine principale de l’app SPA, en pratique `https://app.ink-flow.me` (pas seulement la landing Framer).
- **Redirect URLs** : listez toutes les origines où l’utilisateur peut atterrir après clic dans l’e-mail, par exemple :
  - `https://app.ink-flow.me/`\*\* (reset mdp : `.../reset-password` puis `.../auth/update-password`)
  - `https://app.ink-flow.me/auth/callback`
  - `http://localhost:5173/**` et `http://127.0.0.1:5173/**`
  - `https://*.vercel.app/**` (previews Vercel)
    Si l’URL utilisée par l’app (`emailRedirectTo`, ex. `/auth/callback`) n’est pas autorisée ici, l’inscription peut échouer ou aucun e-mail n’est envoyé.

4. **Authentication → SMTP** (optionnel mais fortement conseillé en prod) : sans **Custom SMTP** (ex. Resend), l’envoi reprend le service intégré Supabase (quotas, délivrabilité variables). Configurez un expéditeur vérifié pour des confirmations fiables.

### 2.4 Storage (avatars, portfolio)

1. **Storage** → Créez un bucket `avatars` (public)
2. **Storage** → Créez un bucket `portfolio` (public)
3. RLS : autorisez la lecture publique, écriture pour les utilisateurs authentifiés

---

## 3. Secrets Edge Functions (Supabase)

**Supabase Dashboard → Project Settings → Edge Functions → Secrets**

### 3.1 Google Calendar

| Secret                 | Valeur                           |
| ---------------------- | -------------------------------- |
| `GOOGLE_CLIENT_ID`     | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Votre Client Secret              |
| `GOOGLE_REDIRECT_URI`  | `https://ink-flow.me/dashboard`  |
| `SITE_URL`             | `https://ink-flow.me`            |

Voir `docs/CALENDAR_SETUP.md` pour la configuration Google Cloud Console.

### 3.2 Stripe

| Secret                           | Valeur                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`              | `sk_live_xxx` (ou `sk_test_xxx` en test)                                                                               |
| `STRIPE_WEBHOOK_SECRET`          | `whsec_xxx` (depuis Stripe Dashboard → Webhooks)                                                                       |
| `STRIPE_PORTAL_CONFIGURATION_ID` | `bpc_xxx` (optionnel — ID de config du Customer Portal depuis Stripe Dashboard → Settings → Billing → Customer portal) |

### 3.3 Resend (emails)

| Secret           | Valeur                                             |
| ---------------- | -------------------------------------------------- |
| `RESEND_API_KEY` | `re_xxx` (depuis [resend.com](https://resend.com)) |

### 3.4 Twilio (SMS — optionnel)

Confirmations RDV vitrine (`send-booking-confirmation`) : si le client a coché le consentement SMS sur `/book`, un court SMS avec lien peut compléter l’e-mail. Sans ces secrets, l’e-mail seul suffit.

| Secret                         | Valeur                            |
| ------------------------------ | --------------------------------- |
| `TWILIO_ACCOUNT_SID`           | `AC…`                             |
| `TWILIO_AUTH_TOKEN`            | Jeton Twilio Console              |
| `TWILIO_MESSAGING_SERVICE_SID` | `MG…` (recommandé) **ou**         |
| `TWILIO_FROM_NUMBER`           | Numéro E.164 vérifié (ex. `+33…`) |

`APP_URL` (ou défaut fallback) doit être une URL absolue pour construire les liens du SMS et du corps d’e-mail.

---

## 4. Déployer les Edge Functions

```bash
# Depuis la racine du projet
npx supabase functions deploy google-calendar-auth
npx supabase functions deploy google-calendar-sync
npx supabase functions deploy create-checkout-session
npx supabase functions deploy create-subscription
npx supabase functions deploy create-portal-session --no-verify-jwt
npx supabase functions deploy stripe-webhook
npx supabase functions deploy send-project-notification
npx supabase functions deploy send-client-conversation-link
npx supabase functions deploy send-booking-confirmation
npx supabase functions deploy send-message-notification
npx supabase functions deploy send-appointment-reminders
npx supabase functions deploy send-aftercare-email
```

---

## 5. Stripe

### 5.1 Price IDs Checkout

1. Stripe Dashboard → Product catalog → créez les prix récurrents : Solo, Pro, Studio (mensuel + annuel)
2. Renseignez les secrets Supabase `STRIPE_PRICE_SOLO_MONTHLY`, `STRIPE_PRICE_SOLO_ANNUAL`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_ANNUAL`, `STRIPE_PRICE_STUDIO_MONTHLY`, `STRIPE_PRICE_STUDIO_ANNUAL`
3. Les abonnements doivent passer par l’Edge Function `create-subscription`, pas par des Payment Links statiques

### 5.2 Webhook

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL : `https://votre-projet.supabase.co/functions/v1/stripe-webhook`
3. Événements : `checkout.session.completed`, `customer.subscription.*`, etc.
4. Copiez le **Signing secret** → secret `STRIPE_WEBHOOK_SECRET` dans Supabase

---

## 6. Google Cloud (Calendar)

1. [console.cloud.google.com](https://console.cloud.google.com) → Nouveau projet
2. **APIs & Services → Library** → activer **Google Calendar API**
3. **Credentials → Create OAuth Client ID** (Web application)
4. Authorized redirect URIs : `https://ink-flow.me/dashboard`
5. Copiez Client ID et Client Secret → secrets Supabase

---

## 7. Resend (emails)

1. [resend.com](https://resend.com) → Créer un compte
2. **API Keys** → Create
3. **Important** : la clé doit être définie dans **Supabase** (pas seulement dans `.env.local`), car les Edge Functions tournent sur les serveurs Supabase :

```bash
 npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
```

4. Pour la prod : vérifiez le domaine (ex. `ink-flow.me`) dans Resend → Domains ; l’app envoie depuis **InkFlow [contact@ink-flow.me](mailto:contact@ink-flow.me)**

### 7.1 Aucun mail reçu

- **Secrets Supabase** : `RESEND_API_KEY` doit être défini côté Supabase (voir ci-dessus). Vérifier : Supabase Dashboard → Project Settings → Edge Functions → voir les secrets listés (les valeurs ne s’affichent pas).
- **401 ou 461 (Unauthorized)** : Supabase rejette la requête **avant** que la fonction ne s'exécute (JWT). Si tu vois 401/461 dans les invocations, **RESEND_API_KEY n'est pas en cause**. **Solution** : `npx supabase functions deploy send-client-conversation-link --no-verify-jwt`.
- **400 Bad Request** : champs `clientEmail`, `clientName` ou `threadId` absents/vides — voir les logs (champ `missing`).
- **\_Ancien 401** (ignorer) : les Edge Functions vérifient le JWT par défaut. Si la console affiche `[InkFlow] Email lien conversation non envoyé` avec une erreur 401 ou "Unauthorized", reconnectez-vous au dashboard puis réessayez. Si le problème persiste (ex. projet avec nouvelles clés JWT), vous pouvez déployer sans vérification JWT : `npx supabase functions deploy send-client-conversation-link --no-verify-jwt` (la fonction ne reçoit que les données en body, l’accès au dashboard reste protégé par l’auth).
- **Console navigateur** : en acceptant une demande, ouvrir F12 → Console. En cas d’échec d’envoi, un message `[InkFlow] Email lien conversation...` s’affiche avec le détail.
- **Logs Edge Function** : Supabase Dashboard → Edge Functions → `send-client-conversation-link` → Logs. Chercher `RESEND_API_KEY is not configured` ou les erreurs Resend (status 4xx/5xx).
- **Domaine Resend** : si le domaine `ink-flow.me` n’est pas vérifié, Resend peut refuser l’envoi ou les mails partent en spam.
- **Spam** : vérifier le dossier spam/courrier indésirable de la boîte du client.

### 7.2 « Je ne reçois aucun mail » — checklist

1. **Supabase → Edge Functions → send-client-conversation-link → Logs** : lors d’un envoi, regarde le statut. **2xx** = fonction OK (vérifier spam + domaine Resend). **401/461** = déployer avec `--no-verify-jwt`. **502** avec `details` = erreur Resend, souvent **domaine non vérifié**.
2. **Test sans domaine** : `npx supabase secrets set RESEND_FROM_EMAIL="InkFlow <onboarding@resend.dev>"` puis redéployer la fonction. Resend peut limiter l’envoi à ton adresse compte.
3. **Domaine vérifié** : Resend → Domains → Add Domain → ton domaine → ajouter les enregistrements DNS (SPF, DKIM). Sans ça, les mails peuvent être refusés ou aller en spam.

---

## 8. Checklist finale

- `.env.local` ou variables Vercel configurées
- Supabase : projet créé, `SUPABASE_BOOTSTRAP.sql` exécuté
- Supabase Auth : Email + Google activés
- Secrets Edge Functions configurés
- Edge Functions déployées
- Stripe : Payment Links + Webhook
- Google Cloud : OAuth Calendar configuré
- Resend : clé API configurée
- Domaine `ink-flow.me` configuré sur Vercel

### 8.1 Santé avant de scaler (micro-entreprise)

À cocher régulièrement — détail dans **`docs/INKFLOW-SCALE-PLAYBOOK.md`** (section 7) :

- Parcours signup → paiement Stripe testé (preview + prod quand tu touches au billing).
- Webhooks Stripe actifs et secrets alignés (`STRIPE_WEBHOOK_SECRET`).
- Accès projet Supabase documenté (sans partager les secrets en clair).
- Support réactif : modèles dans **`docs/SUPPORT-FAQ-TEMPLATES.md`**.
- Vue coûts / marge : grille **`docs/UNIT-ECONOMICS-SNAPSHOT.md`**.

---

## 9. Inventaire Edge Functions (référence)

Dossiers sous `supabase/functions/` (hors `_shared`). Déployer avec `npx supabase functions deploy <nom>` ; ajouter `--no-verify-jwt` seulement si la fonction est appelée sans session utilisateur et que la doc du fichier l’indique.

| Domaine                 | Fonctions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stripe / paiements**  | `stripe-webhook`, `create-checkout-session`, `create-subscription`, `create-portal-session`, `create-theme-checkout-session`, `get-payment-session`, `stripe-connect-onboarding`, `stripe-connect-actions`, `stripe-terminal`, `notify-new-booking`, `send-deposit-studio-notification`, `send-payment-confirmation`, `remind-unpaid-deposits`, `remind-balance-day-of`, `post-appointment-closeout`, `restrict-expired-trials`                                                                                                                           |
| **Emails (Resend)**     | `send-booking-confirmation`, `send-booking-refusal`, `send-message-notification`, `send-project-notification`, `send-client-conversation-link`, `send-client-magic-link`, `send-studio-auth-link`, `send-password-recovery`, `send-collaborator-invite`, `send-aftercare-email`, `send-appointment-reminders`, `send-appointment-feedback`, `send-tattooer-welcome`, `send-alternative-date-proposal`, `send-loyalty-emails`, `send-stamp-reward-email`, `send-referral-notification`, `send-email-test`, `resend-webhook`, `email-marketing-unsubscribe` |
| **Google**              | `google-calendar-auth`, `google-calendar-sync`, `google-calendar-webhook`, `google-places`, `google-business-auth`                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Instagram**           | `instagram`, `instagram-webhook`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Demandes / projets**  | `project-request-accept`, `project-request-reject`, `price-contribution-submit`, `process-stamp-loyalty-db`, `wallet-loyalty-pass`                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **CRM / dispo**         | `get-studio-availability`, `verify-turnstile`, `notification-webhook`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Onboarding / compte** | `onboarding-automation`, `delete-studio-account`, `export-studio-gdpr`, `complete-referral`, `process-referral`, `register-native-device`, `push-subscribe`, `send-push-notification`, `remind-slot-closeout-nudge`                                                                                                                                                                                                                                                                                                                                       |
| **Admin / interne**     | `admin-founder-metrics`, `call-gemini`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

La liste peut évoluer : comparer avec `ls supabase/functions` après pull.

---

## 10. Docs liées (scale & exploitation)

| Fichier                                                                    | Usage                                               |
| -------------------------------------------------------------------------- | --------------------------------------------------- |
| [`INKFLOW-SCALE-PLAYBOOK.md`](./INKFLOW-SCALE-PLAYBOOK.md)                 | Priorités produit / acquisition / support / finance |
| [`REGRESSION-CRITICAL-PATHS.md`](./REGRESSION-CRITICAL-PATHS.md)           | Tests manuels + smoke Playwright                    |
| [`SUPPORT-FAQ-TEMPLATES.md`](./SUPPORT-FAQ-TEMPLATES.md)                   | Réponses types support                              |
| [`UNIT-ECONOMICS-SNAPSHOT.md`](./UNIT-ECONOMICS-SNAPSHOT.md)               | Grille coûts / MRR mensuelle                        |
| [`NORTH-STAR-FUNNEL.md`](./NORTH-STAR-FUNNEL.md)                           | Funnel analytics tatoueur                           |
| [`SECURITY-NARRATIVE-STRIPE-RGPD.md`](./SECURITY-NARRATIVE-STRIPE-RGPD.md) | Secrets, RLS, communication conformité              |
