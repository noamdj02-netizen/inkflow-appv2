# Checklist préparation production — Calendrier, réservations, finance

Document **opérationnel** pour valider InkFlow avant mise en mains clients.  
Code de référence : `vite.config.ts` (**port dev Vite = 3000**), Edge sous `supabase/functions/`.

> **Vue fondateur — MVP « fini » (ce que tu dois faire vs le code) :** [`MVP-FINI-ACTIONS-FOUNDATEUR.md`](./MVP-FINI-ACTIONS-FOUNDATEUR.md)

Voir aussi : [`CALENDAR_SETUP.md`](./CALENDAR_SETUP.md), [`STRIPE-P0-PRODUCTION.md`](./STRIPE-P0-PRODUCTION.md), [`ENV-PRODUCTION.md`](./ENV-PRODUCTION.md), [`CONFIGURATION.md`](./CONFIGURATION.md).

---

## Port & URLs locales (piège fréquent)

| Surface                        | URL type (ce repo)                                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dev Vite SPA                   | `http://localhost:3000` (cf. `vite.config.ts` → `server.port`)                                                                                         |
| OAuth Google Calendar redirect | `GOOGLE_REDIRECT_URI` = **`http://localhost:3000/dashboard`** en local (**identique** à Google Cloud Console — chemin aligné sur retour OAuth InkFlow) |
| Prod app                       | ex. `https://app.ink-flow.me`                                                                                                                          |

**Supabase Auth → URL Configuration** : autoriser `http://localhost:3000/**` (et `127.0.0.1:3000` si tu l’utilises), plus la prod. Si tu changes le port Vite, mets à jour **ici + Google + Supabase** en même temps.

---

## 1. Calendrier Google

| #   | Contrôle                                                                                                                                                           | OK ? |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| 1.1 | Secrets Supabase : `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `SITE_URL` (optionnel mais utile)                                            | ☐    |
| 1.2 | Google Cloud : **Google Calendar API** activée ; OAuth client **Web** ; redirect URI **exacte** (port 3000 en dev)                                                 | ☐    |
| 1.3 | Écran de consentement : scopes calendrier (`calendar` / `calendar.events` selon setup)                                                                             | ☐    |
| 1.4 | Déploiement : `google-calendar-auth`, `google-calendar-sync`, `google-calendar-webhook` — si CORS OPTIONS bloqué, **`--no-verify-jwt`** (voir `CALENDAR_SETUP.md`) | ☐    |
| 1.5 | Test : Dashboard → **Paramètres calendrier** → connexion OAuth → **Pousser** un RDV → vérifier événement dans Google                                               | ☐    |

```bash
npx supabase functions deploy google-calendar-auth --no-verify-jwt
npx supabase functions deploy google-calendar-sync --no-verify-jwt
npx supabase functions deploy google-calendar-webhook --no-verify-jwt
```

---

## 2. Réservations (vitrine / tunnel book)

| #   | Contrôle                                                                                                                                | OK ? |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 2.1 | Edge **`get-studio-availability`** déployée ; studio avec **créneaux / dispos** configurés (message dispo dans le dashboard si vide)    | ☐    |
| 2.2 | Parcours `/book/:slug` (ou équivalent) : choix date/créneau → création **booking** → état attendu en base / inbox tatoueur              | ☐    |
| 2.3 | Edge **`notify-new-booking`** + **`RESEND_API_KEY`** si tu relies aux mails de notif                                                    | ☐    |
| 2.4 | (Optionnel) **Turnstile** : `VITE_TURNSTILE_SITE_KEY` (Vercel) + `TURNSTILE_SECRET_KEY` + `verify-turnstile` — voir `AUTH-HARDENING.md` | ☐    |

```bash
npx supabase functions deploy get-studio-availability
npx supabase functions deploy notify-new-booking --no-verify-jwt
```

---

## 3. Finance & Stripe (plateforme + Connect)

### 3.1 Secrets & mode Live

| #     | Contrôle                                                                                                                                                       | OK ? |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 3.1.1 | `STRIPE_SECRET_KEY` = **`sk_live_…`** dans les secrets Edge (pas dans le frontend)                                                                             | ☐    |
| 3.1.2 | Webhook Stripe **endpoint Live** vers `https://<project-ref>.supabase.co/functions/v1/stripe-webhook` ; `STRIPE_WEBHOOK_SECRET` = **`whsec_` de cet endpoint** | ☐    |
| 3.1.3 | `SITE_URL` / `APP_URL` = URL **publique** réelle pour `success_url` / `cancel_url` et portail                                                                  | ☐    |
| 3.1.4 | (Front) Si besoin checkout côté client : `pk_live_…` — jamais la clé secrète (`ENV-PRODUCTION.md`)                                                             | ☐    |

```bash
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

### 3.2 Abonnements SaaS (tatoueurs)

| #     | Contrôle                                                                                                                | OK ? |
| ----- | ----------------------------------------------------------------------------------------------------------------------- | ---- |
| 3.2.1 | Secrets prix : `STRIPE_PRICE_SOLO_MONTHLY`, `SOLO_ANNUAL`, `PRO_*`, `STUDIO_*` (alignés Stripe Dashboard produits Live) | ☐    |
| 3.2.2 | Test : connexion tatoueur → upgrade / checkout abonnement → webhook met à jour studio / quotas                          | ☐    |

Référence : `docs/PLANS-PERMISSIONS.md` (noms plans).

### 3.3 Paiements clients (acomptes / solde — Stripe Connect)

| #     | Contrôle                                                                                                                                                                | OK ? |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 3.3.1 | Edge **`stripe-connect-onboarding`** + **`create-checkout-session`** (+ terminal si utilisé) déployées                                                                  | ☐    |
| 3.3.2 | Chaque studio payant en ligne : **onboarding Connect terminé**, `stripe_connect_charges_enabled` (ou équivalent) — logique métier dans `lib/studioPaymentConfigured.ts` | ☐    |
| 3.3.3 | Petit paiement **Live** test : signature webhook OK, **une seule** application d’effet métier (idempotence `inkflow_stripe_processed_events`)                           | ☐    |
| 3.3.4 | (Optionnel) `INKFLOW_CONNECT_APPLICATION_FEE_BPS` si commission plateforme                                                                                              | ☐    |
| 3.3.5 | **Customer Portal** configuré dans Stripe + `create-portal-session` ; test « 2 studios » ne voient pas les données de l’autre                                           | ☐    |

```bash
npx supabase functions deploy stripe-connect-onboarding
npx supabase functions deploy stripe-connect-actions
npx supabase functions deploy create-checkout-session
npx supabase functions deploy create-subscription
npx supabase functions deploy create-portal-session --no-verify-jwt
npx supabase functions deploy get-payment-session
```

### 3.4 Hors code court terme

- **TVA / Stripe Tax** : ne pas activer `automatic_tax` sans validation comptable + tests (`STRIPE-P0-PRODUCTION.md` §4).

---

## 4. Emails transactionnels (Resend)

| #   | Contrôle                                                                                    | OK ? |
| --- | ------------------------------------------------------------------------------------------- | ---- |
| 4.1 | `RESEND_API_KEY` en secret Supabase ; domaine expéditeur **vérifié** en prod                | ☐    |
| 4.2 | (Recommandé) `RESEND_WEBHOOK_SECRET` + déploiement `resend-webhook` pour bounces / plaintes | ☐    |

---

## 5. Instagram / Meta (si activé)

| #   | Contrôle                                                                                      | OK ? |
| --- | --------------------------------------------------------------------------------------------- | ---- |
| 5.1 | `META_WEBHOOK_VERIFY_TOKEN` (choisi par toi, identique Meta + Supabase)                       | ☐    |
| 5.2 | `META_APP_SECRET` ou `FACEBOOK_APP_SECRET` ; URL webhook = `…/functions/v1/instagram-webhook` | ☐    |
| 5.3 | `npx supabase functions deploy instagram-webhook`                                             | ☐    |

---

## 6. Synthèse « go / no-go »

**No-go** si l’un de ces points est faux en prod :

- Redirect OAuth Google ≠ URL réelle (port / chemin).
- Webhook Stripe en **Test** alors que les clés sont **Live** (ou l’inverse).
- Studio censé encaisser des acomptes **sans** Connect opérationnel (`charges_enabled`).
- `SITE_URL` encore en `localhost` alors que les clients paient en production.

**Go** quand : §1.5 + au moins un flux résa §2.2 + §3.3.3 + mails critiques §4.1 validés sur l’environnement cible. Pour **prioriser dans Linear**, voir **§8**.

---

## 7. Commande rapide (paquet fonctions critiques)

À adapter selon ton périmètre ; les noms sont les dossiers sous `supabase/functions/`.  
**Coller dans le terminal : une ligne = une commande** (ne pas coller sans retours à la ligne, sinon `npx` se colle au nom suivant).

```bash
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy create-checkout-session
npx supabase functions deploy create-subscription
npx supabase functions deploy create-portal-session --no-verify-jwt
npx supabase functions deploy stripe-connect-onboarding
npx supabase functions deploy stripe-connect-actions
npx supabase functions deploy get-payment-session
npx supabase functions deploy get-studio-availability
npx supabase functions deploy notify-new-booking --no-verify-jwt
npx supabase functions deploy google-calendar-auth --no-verify-jwt
npx supabase functions deploy google-calendar-sync --no-verify-jwt
npx supabase functions deploy google-calendar-webhook --no-verify-jwt
```

Instagram (si actif) : `npx supabase functions deploy instagram-webhook`

Après **chaque** changement de secret : redéployer la fonction qui le consomme.

---

## 8. Tickets Linear suggérés (depuis ce check-up)

Créer une **initiative** ou **label** `prod-readiness`, puis des issues **copier-coller** (titre + description). Cocher la checklist principale quand chaque issue est « Done ».

### INK-OPS-01 — URLs & secrets (P0)

**Titre :** `Prod readiness — Supabase Auth redirects + OAuth Google (port 3000)`

**Description :**

- Vérifier Redirect URLs : `localhost:3000`, prod app, previews si besoin (`docs/CONFIGURATION.md`).
- `GOOGLE_REDIRECT_URI` secret = URI **exacte** Google Cloud (dev + prod).
- Documenter `SITE_URL` prod (pas localhost pour paiements clients).

**Réf.** : checklist §« Port & URLs », §« 1.x » secrets.

---

### INK-CAL-01 — Calendrier Google (P0 si feature active)

**Titre :** `Prod readiness — Déployer + tester Google Calendar (auth, sync, webhook)`

**Description :**

- Déployer : `google-calendar-auth`, `google-calendar-sync`, `google-calendar-webhook` (`--no-verify-jwt` si CORS).
- Test manuel : connexion OAuth + pousser 1 RDV → événement visible dans Google.

**Réf.** : checklist §1, §7.

---

### INK-BOOK-01 — Réservations vitrine

**Titre :** `Prod readiness — Tunnel /book + get-studio-availability + notify-new-booking`

**Description :**

- Déployer `get-studio-availability`, `notify-new-booking` (`--no-verify-jwt`).
- Studio test avec dispos configurées ; parcours complet jusqu’à RDV/inbox tatoueur.
- `RESEND_API_KEY` si mails de notif attendus.

**Réf.** : checklist §2.

---

### INK-STRIPE-01 — Stripe Live + webhook (P0)

**Titre :** `Prod readiness — Stripe Live, webhook signing secret, deploy stripe-webhook`

**Description :**

- `STRIPE_SECRET_KEY` live ; endpoint webhook live → `stripe-webhook` ; `STRIPE_WEBHOOK_SECRET` aligné (`whsec_` du même endpoint).
- Déployer `stripe-webhook --no-verify-jwt`.
- Petit paiement test + vérifier idempotence (`inkflow_stripe_processed_events`).

**Réf.** : checklist §3.1, `docs/STRIPE-P0-PRODUCTION.md`.

---

### INK-STRIPE-02 — Abonnements + portail SaaS

**Titre :** `Prod readiness — Price IDs secrets + create-subscription + Customer Portal`

**Description :**

- Secrets `STRIPE_PRICE_*` solo/pro/studio mensuel & annuel (Live).
- Déployer `create-subscription`, `create-portal-session`, `get-payment-session`.
- Test upgrade + portail Stripe (facturation).

**Réf.** : checklist §3.2, §3.3.

---

### INK-STRIPE-03 — Connect acomptes clients

**Titre :** `Prod readiness — Stripe Connect onboarding + create-checkout-session (2 studios)`

**Description :**

- Déployer `stripe-connect-onboarding`, `stripe-connect-actions`, `create-checkout-session`.
- 2 studios : chacun complete Connect (`charges_enabled`) ; checkout acompte ne fuit pas données cross-tenant portail/client.

**Réf.** : checklist §3.3, `lib/studioPaymentConfigured.ts`.

---

### INK-EMAIL-01 — Resend prod

**Titre :** `Prod readiness — Resend domaine vérifié + option resend-webhook`

**Description :**

- `RESEND_API_KEY` dans secrets Supabase ; domaine DKIM actif en prod.
- Option : `RESEND_WEBHOOK_SECRET` + deploy `resend-webhook`.

**Réf.** : checklist §4.

---

### INK-META-01 — Instagram webhook (si activé)

**Titre :** `Prod readiness — instagram-webhook (verify token + app secret)`

**Description :**

- Secrets `META_WEBHOOK_VERIFY_TOKEN`, `META_APP_SECRET` (ou `FACEBOOK_APP_SECRET`).
- URL Meta → `/functions/v1/instagram-webhook` ; déployer la fonction ; test handshake + POST signé.

**Réf.** : checklist §5.
