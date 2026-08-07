# AUDIT-INKFLOW

> Audit **lecture seule** — aucun code modifié hors ce livrable.  
> Date : 2026-08-05 · Repo : racine Vite InkFlow (`app.ink-flow.me`)  
> Méthode : inventaire fichiers + lecture ciblée `App.tsx` / pages / edge / PWA ; échantillonnage sur fichiers >1k lignes (ex. `DashboardPro`, `ClientDashboard`).

---

## 1. Vue d'ensemble

### Stack technique détectée

| Couche             | Techno                                                                         | Versions clés (lock/package)                                 |
| ------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Frontend principal | **Vite + React + TypeScript** (SPA custom router dans `App.tsx`, **pas** Next) | React **19.2.4**, Vite **6.4.2**, Tailwind **4.1**           |
| UI                 | Tailwind + shadcn/radix, lucide-react, framer-motion                           | —                                                            |
| Backend            | **Supabase** (Auth, Postgres, Realtime, Storage, Edge Deno)                    | `@supabase/supabase-js` **2.95.3** · **~137** migrations SQL |
| Paiements          | Stripe Checkout + Connect + Terminal + webhooks                                | `@stripe/terminal-js`                                        |
| Emails             | Resend (+ React Email)                                                         | `resend` 6.x                                                 |
| SMS                | Twilio (via Edge consent / notifs)                                             | —                                                            |
| Observabilité      | Sentry, PostHog, Vercel Analytics                                              | —                                                            |
| PWA                | `vite-plugin-pwa` + SW custom `public/sw.js`                                   | —                                                            |
| Native Pro         | Expo shell `inkflow-mobile/` (WebView + Tap to Pay)                            | bundle `me.inkflow.studio`                                   |
| Native Client      | Expo séparé `apps/inkflow-client/`                                             | bundle `me.inkflow.client`                                   |
| Hosting            | Vercel (frontend + `api/`) + Supabase                                          | —                                                            |

### Nombre de fichiers source (approximatif)

| Zone                                  | Fichiers `.ts`/`.tsx` (approx.) | Lignes (approx.)     |
| ------------------------------------- | ------------------------------- | -------------------- |
| `components/`                         | 285                             | ~79k                 |
| `pages/`                              | 47                              | ~23k                 |
| `lib/`                                | 180                             | ~20k                 |
| `hooks/`                              | 28                              | ~3.5k                |
| `contexts/` + `types/` + `emails/`    | ~19                             | ~7.6k                |
| **Core app Vite** (ci-dessus + entry) | **~559**                        | **~132k**            |
| `supabase/functions/`                 | ~93 (68 fonctions + `_shared`)  | ~18k                 |
| `inkflow-mobile/` (hors node_modules) | ~36                             | ~4k                  |
| `apps/inkflow-client/`                | —                               | ~0.7k                |
| Migrations SQL                        | 137 fichiers                    | (non comptées en TS) |

**Lecture :** le produit « app tatoueur » tient surtout dans `components/` + `pages/` + `lib/` + Edge (~150k LOC TS utiles). Le bruit perçu vient aussi de dossiers satellites (`docs/`, skills, `_design_import/`, `mon-app/`, `mobile/`, `video/`, worktrees).

---

## 2. Arbre des dossiers commenté

| Dossier                                                    | Rôle réel                                                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `App.tsx` / `index.tsx`                                    | Point d’entrée SPA : auth, thème, **toutes les routes**, providers                         |
| `components/`                                              | UI métier + design system (dashboard Pro, CRM, booking, vitrine, landing, admin, consent…) |
| `pages/`                                                   | Écrans routés (et quelques orphelins non branchés)                                         |
| `hooks/`                                                   | Logique réactive : booking, dashboard sync, realtime, media…                               |
| `lib/`                                                     | Cœur métier sans UI : Supabase, Stripe, notifs, discover, founder metrics, URLs            |
| `contexts/`                                                | Auth, toast, langue, privacy studio, sync Supabase                                         |
| `types/`                                                   | Types partagés + `database.ts` généré                                                      |
| `supabase/migrations/`                                     | Schéma, RLS, triggers, crons pg_cron                                                       |
| `supabase/functions/`                                      | ~68 Edge Functions Deno (paiements, emails, push, Google, cron…)                           |
| `supabase/functions/_shared/`                              | Layout emails, Resend, helpers Stripe/CORS partagés                                        |
| `api/`                                                     | Handlers Vercel (cron daily-brief, push subscribe, accept/reject projets)                  |
| `public/`                                                  | Assets statiques, icônes PWA, splash iOS, `.well-known`                                    |
| `emails/`                                                  | Templates React Email (dev/preview Resend)                                                 |
| `scripts/`                                                 | Seeds, readiness, sitemap, tests email, génération icônes                                  |
| `docs/`                                                    | Checklists prod, App Store, push, plans, audits historiques                                |
| `inkflow-mobile/`                                          | App Store **Inkflow Pro** (shell Expo WebView + native Tap to Pay)                         |
| `apps/inkflow-client/`                                     | App Expo **client** séparée (surface distincte, moins mature côté store)                   |
| `data/`                                                    | Fixtures demo marketing                                                                    |
| `tests/`                                                   | Playwright e2e                                                                             |
| `mon-app/`                                                 | Petit Next isolé — **hors** produit principal                                              |
| `mobile/`                                                  | Anciennes maquettes RN — pas le shell de prod                                              |
| `inkflow/`                                                 | Mini scaffold Expo legacy                                                                  |
| `_design_import/`, `_logo_variants/`, `_zip_10/`           | Imports design / logos / notes — pas runtime                                               |
| `claude-skills/`, `loop-contexts/`, `.agents/`, `.cursor/` | Outillage agents, pas produit                                                              |
| `video/`                                                   | Remotion / démo vidéo                                                                      |
| `dist/`                                                    | Build Vite (généré)                                                                        |

---

## 3. Routes et pages

Router custom dans `App.tsx` (string + RegExp). Statut jugé sur imports, TODOs, code mort visible — **pas** un test runtime.

### Routes branchées (principales)

| Route                                                         | Pour qui / à quoi                              | Composants principaux                 | Statut                                                   |
| ------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------- | -------------------------------------------------------- |
| `/`                                                           | Landing marketing                              | `LandingPage`, `LandingEnhanceAI`     | **fonctionnelle**                                        |
| `/login`, `/signup`                                           | Auth tatoueur                                  | `LoginPage` / `SignupPage`            | **fonctionnelle**                                        |
| `/installer`                                                  | Guide PWA « ajouter à l’écran d’accueil »      | `AddToHomeScreenPage`                 | **fonctionnelle**                                        |
| `/invite/:code`                                               | Referral → signup                              | `InviteRedirectPage`                  | **fonctionnelle**                                        |
| `/reset-password`, `/auth/update-password`, `/auth/callback*` | Recovery / OAuth                               | pages auth                            | **fonctionnelle**                                        |
| `/instagram/callback`                                         | Retour OAuth IG                                | `InstagramCallbackPage`               | **fonctionnelle** (dépend secrets)                       |
| `/demo`, `/dashboard-demo`                                    | Démo marketing UI Pro                          | `DashboardDemoPage`                   | **fonctionnelle** (fake data)                            |
| `/vue-ensemble`…`/parametres`                                 | Pages SEO features                             | `FeatureDetailPage`                   | **fonctionnelle**                                        |
| `/dashboard`                                                  | **App Pro** (CRM, agenda, demandes, settings…) | `DashboardPage` → `DashboardPro`      | **fonctionnelle** (cœur produit)                         |
| `/dashboard/signalement`                                      | Feedback produit                               | `InkflowFeedbackPage`                 | **fonctionnelle**                                        |
| `/agenda`                                                     | Deep link → onglet RDV                         | `AgendaDeepLinkPage`                  | **fonctionnelle**                                        |
| `/studio/:slug`                                               | Vitrine publique                               | `PublicStudioPagePro` + thèmes        | **fonctionnelle**                                        |
| `/book/:slug`                                                 | Tunnel réservation client                      | `PublicBookingPage`, `useBookingFlow` | **fonctionnelle**                                        |
| `/rdv/merci/:token`, `/reservation-succes`                    | Post-booking / Stripe success                  | recap + success pages                 | **fonctionnelle**                                        |
| `/consent/:id`                                                | Signature consentement                         | `ConsentPage`, `ConsentFormSign`      | **fonctionnelle**                                        |
| `/tap-to-pay`                                                 | Bridge HTTPS → app native                      | `TapToPayHandoffPage`                 | **fonctionnelle** (shell)                                |
| `/messages/:id`, `/c/:id`                                     | Messagerie publique client                     | `PublicMessagePage`                   | **fonctionnelle**                                        |
| Légal / aide / changelog                                      | Contenu légal & FAQ                            | pages dédiées                         | **fonctionnelle**                                        |
| `/referral`                                                   | Programme parrainage (auth)                    | `ReferralPage`                        | **fonctionnelle**                                        |
| `/admin`, `/admin/:section`                                   | Dashboard fondateur                            | `FounderDashboardPage`                | **fonctionnelle** (allowlist)                            |
| `/admin/debug-experience`, `/admin/daily-brief`               | Outils internes                                | pages admin                           | **fonctionnelle**                                        |
| `/discover`, `/discover/login`                                | Hub compte client                              | `ClientAccountHubPage`                | **à moitié** — hub live, pas le gros shell tabs          |
| `/discover/bienvenue`                                         | Onboarding client                              | `ClientWelcomeOnboardingPage`         | **fonctionnelle**                                        |
| `/mon-compte`, `/client/*`                                    | Legacy → redirects discover                    | redirects inline                      | **fonctionnelle**                                        |
| `/explorer`, `/explorer/:city`, `/explorer/:city/:style`      | Annuaire SEO tatoueurs                         | `Discover*Page`                       | **fonctionnelle**                                        |
| `/discover/:city…`                                            | Anciennes URLs annuaire                        | redirect → `/explorer`                | **fonctionnelle**                                        |
| `/artist/:slug`, `/flash/:slug`                               | Fiches artiste / flash publiques               | `ArtistPage`, `FlashPage`             | **à moitié** — code là ; maturité data/schéma incertaine |
| 404                                                           | Fallback                                       | inline `NotFoundPage`                 | **fonctionnelle**                                        |

### Pages présentes mais **non routées** (orphelines)

| Fichier                                                      | Verdict                                                   |
| ------------------------------------------------------------ | --------------------------------------------------------- |
| `pages/public/ClientDashboard.tsx` (~4.2k lignes)            | **mort / cassé** — jamais monté ; `/discover` sert le hub |
| `pages/DemoSandboxPage.tsx` (~1.7k)                          | **mort**                                                  |
| `pages/public/PublicStudioPage.tsx`                          | **mort** (mock) — remplacé par `…Pro`                     |
| `pages/public/PublicBookingPagePro.tsx`                      | **mort** — live = `PublicBookingPage`                     |
| `pages/client/*` (login, health, finalize, embed, favorites) | **morts** — redirects legacy                              |
| `pages/_error.tsx`                                           | **résidu Next** dans une app Vite                         |

---

## 4. Edge Functions Supabase

**68** dossiers fonctions (hors `_shared`). Synthèse : **~57 CALLED** · **~7 UNCERTAIN** (webhook/cron externe sans caller repo) · **~3 ORPHAN**.

### Paiements / Stripe

| Function                           | Rôle                           | Appelée ?                                   |
| ---------------------------------- | ------------------------------ | ------------------------------------------- |
| `create-checkout-session`          | Checkout acompte/solde Connect | **CALLED** (`lib/stripeClient.ts`)          |
| `create-subscription`              | Abonnement SaaS                | **CALLED**                                  |
| `create-portal-session`            | Customer Portal                | **CALLED**                                  |
| `create-theme-checkout-session`    | Thèmes vitrine payants         | **CALLED**                                  |
| `stripe-connect-onboarding`        | Onboarding Connect             | **CALLED**                                  |
| `stripe-connect-actions`           | Sync / dashboard / disconnect  | **CALLED**                                  |
| `stripe-terminal`                  | Terminal / Tap to Pay          | **CALLED**                                  |
| `stripe-webhook`                   | Événements Stripe              | **UNCERTAIN** (externe Dashboard — attendu) |
| `get-payment-session`              | Récap session Checkout         | **CALLED**                                  |
| `generate-payment-invoice`         | PDF facture Storage            | **CALLED**                                  |
| `send-payment-confirmation`        | Email client post-paiement     | **CALLED** (depuis webhook)                 |
| `send-deposit-studio-notification` | Email studio acompte           | **CALLED**                                  |
| `remind-unpaid-deposits`           | Cron relance acomptes          | **CALLED** (migration cron)                 |
| `remind-balance-day-of`            | Cron solde jour J              | **CALLED**                                  |
| `restrict-expired-trials`          | Restreindre trials expirés     | **UNCERTAIN** (docs, pas de cron repo)      |

### Booking / inbox / projets

| Function                         | Rôle                           | Appelée ?                                         |
| -------------------------------- | ------------------------------ | ------------------------------------------------- |
| `notify-new-booking`             | Email tatoueur nouveau booking | **CALLED**                                        |
| `get-studio-availability`        | Créneaux / occupation          | **CALLED**                                        |
| `send-booking-confirmation`      | Confirm client                 | **CALLED**                                        |
| `send-booking-refusal`           | Refus client                   | **CALLED**                                        |
| `send-alternative-date-proposal` | Contre-proposition date        | **CALLED**                                        |
| `send-project-notification`      | Notif nouvelle demande projet  | **CALLED**                                        |
| `send-client-conversation-link`  | Lien thread message            | **CALLED**                                        |
| `project-request-accept`         | Accepter projet                | **CALLED**                                        |
| `project-request-reject`         | Refuser projet                 | **CALLED** (lib) — **UI reject peu/pas branchée** |
| `remind-tattooer-pending-inbox`  | Digest demandes en attente     | **ORPHAN** (pas de cron/caller)                   |
| `post-appointment-closeout`      | Push post-RDV completed        | **CALLED** (trigger)                              |
| `remind-slot-closeout-nudge`     | Nudge closeout créneau         | **CALLED** (cron)                                 |

### Emails / messaging / consent / loyalty

| Function                      | Rôle                         | Appelée ?                                     |
| ----------------------------- | ---------------------------- | --------------------------------------------- |
| `send-message-notification`   | Email/push nouveau message   | **CALLED**                                    |
| `send-aftercare-email`        | Conseils aftercare           | **CALLED**                                    |
| `send-consent-request`        | Lien consentement email/SMS  | **CALLED**                                    |
| `send-appointment-reminders`  | Rappels J-2/J-1/H-2          | **CALLED**                                    |
| `send-appointment-feedback`   | Demande avis post-séance     | **UNCERTAIN** (pas de cron migration)         |
| `send-loyalty-emails`         | Séquence fidélité J+1/7/30   | **CALLED**                                    |
| `send-stamp-reward-email`     | Récompense tampon            | **CALLED**                                    |
| `send-referral-notification`  | Notif parrain                | **CALLED**                                    |
| `send-email-test`             | Smoke-test Resend dashboard  | **CALLED**                                    |
| `send-tattooer-welcome`       | Bienvenue tatoueur           | **CALLED**                                    |
| `send-studio-auth-link`       | Magic link activation studio | **CALLED**                                    |
| `send-password-recovery`      | Reset password brandé        | **CALLED**                                    |
| `send-client-magic-link`      | Magic link client            | **CALLED** (`apps/inkflow-client`)            |
| `send-collaborator-invite`    | Invite collab                | **CALLED**                                    |
| `email-marketing-unsubscribe` | Désabo HMAC                  | **CALLED** (liens mails)                      |
| `resend-webhook`              | Bounces/complaints           | **UNCERTAIN** (externe)                       |
| `onboarding-automation`       | Nurture 24h/48h/72h          | **UNCERTAIN** (docs/deploy, pas pg_cron repo) |

### Push / devices

| Function                 | Rôle                    | Appelée ?                        |
| ------------------------ | ----------------------- | -------------------------------- |
| `send-push-notification` | Web Push + Expo         | **CALLED**                       |
| `push-subscribe`         | Enregistrement Web Push | **CALLED**                       |
| `register-native-device` | Token Expo Pro          | **CALLED**                       |
| `notification-webhook`   | DB webhook → push       | **UNCERTAIN** (config Dashboard) |

### Google / Instagram / AI

| Function                  | Rôle                 | Appelée ?                                  |
| ------------------------- | -------------------- | ------------------------------------------ |
| `google-calendar-auth`    | OAuth Calendar       | **CALLED**                                 |
| `google-calendar-sync`    | Sync RDV ↔ Calendar  | **CALLED**                                 |
| `google-calendar-webhook` | Push Google Calendar | **UNCERTAIN** (pas de watch URL dans code) |
| `google-places`           | Places API serveur   | **CALLED**                                 |
| `google-business-auth`    | GBP OAuth            | **CALLED**                                 |
| `instagram`               | Actions Messaging IG | **CALLED**                                 |
| `instagram-webhook`       | Ingest Meta          | **UNCERTAIN**                              |
| `call-gemini`             | Gemini côté serveur  | **CALLED**                                 |

### Compte / GDPR / admin / divers

| Function                                 | Rôle                              | Appelée ?                               |
| ---------------------------------------- | --------------------------------- | --------------------------------------- |
| `admin-founder-metrics`                  | Métriques fondateur               | **CALLED**                              |
| `export-studio-gdpr`                     | Export RGPD                       | **CALLED**                              |
| `delete-studio-account`                  | Suppression compte                | **CALLED**                              |
| `process-referral` / `complete-referral` | Parrainage                        | **CALLED**                              |
| `process-stamp-loyalty-db`               | Tampons auto                      | **CALLED** (trigger)                    |
| `wallet-loyalty-pass`                    | Pass Wallet                       | **CALLED**                              |
| `client-favorite`                        | Favoris studios                   | **CALLED**                              |
| `verify-turnstile`                       | Cloudflare Turnstile              | **CALLED**                              |
| `submit-product-feedback`                | Signalement produit               | **CALLED**                              |
| `price-contribution-submit`              | Contribution prix validée serveur | **ORPHAN** — UI fait un `insert` direct |

**Écart notable :** `lib/simulateInkflowExperience.ts` invoque `simulate-inkflow-experience` mais **aucun dossier** Edge correspondant.

---

## 5. Code mort et doublons suspects

### Fichiers / composants quasi sûrement non importés

- `pages/public/ClientDashboard.tsx` (~4200 lignes) — plus gros cadavre
- `pages/DemoSandboxPage.tsx` (~1700)
- `pages/public/PublicStudioPage.tsx`, `PublicBookingPagePro.tsx`
- `pages/client/ClientOnboardingFinalizePage.tsx`, `ClientStudioEmbedPage.tsx`, `ClientHealthOnboardingPage.tsx`, `ClientFavoritesTab.tsx`, `ClientPortalLoginPage.tsx`
- `pages/_error.tsx`
- `components/landing/LandingBelowFold.tsx`, `components/TrustedLogos.tsx`, `components/Mascots.tsx`, `components/OnboardingBanner.tsx`

**Ordre de grandeur :** ~7.5k+ lignes UI orphelines haute confiance (analyse import/route, pas dead-code tooling complet).

### Doublons / surfaces parallèles

| Live                                              | Legacy / doublon                                     |
| ------------------------------------------------- | ---------------------------------------------------- |
| `PublicStudioPagePro`                             | `PublicStudioPage` (mock)                            |
| `PublicBookingPage` + `useBookingFlow`            | `PublicBookingPagePro`                               |
| `ClientAccountHubPage` + `/explorer`              | `ClientDashboard` monolithe non monté                |
| `BookingForm` (dashboard) vs `VitrineBookingForm` | **les deux live** — split intentionnel               |
| Edge `price-contribution-submit`                  | insert client dans `lib/supabaseFinanceInventory.ts` |
| Landing EnhanceAI                                 | `LandingBelowFold` mort                              |

### Noms `Copy` / `old` / `v2` / `backup` / `test-`

**Aucun** fichier produit sous `components/`, `pages/`, `lib/`, `hooks/` avec ces patterns. Bruit uniquement dans docs/skills/scripts (`BACKUP-RECOVERY`, `test-supabase-auth…`).

---

## 6. Parcours utilisateurs critiques (trace complète)

### 1. Réservation d’un RDV par un client (`/book/:slug`)

1. `App.tsx` → route `/book/:slug`
2. `pages/public/PublicBookingPage.tsx`
3. `hooks/useBookingFlow.ts`
4. UI : `BookingAppInterface480`, `ProjectRequestForm`, `HealthQuestionnaireForm`, `FlashCard`, `BookingMotion`
5. Studio : `lib/supabaseDashboard.ts` → RPC `get_studio_public_by_slug` → **`inkflow_studios`**
6. Vitrine/flashs : `lib/vitrineStorage.ts` → **`inkflow_vitrine_data`**, **`inkflow_flash_designs`**
7. Artistes : `lib/publicStudioArtists.ts` → **`inkflow_artists`**
8. Dispo : `lib/studioAvailability.ts` → Edge **`get-studio-availability`**
9. Santé optionnelle : `lib/clientHealthProfile.ts` → **`inkflow_client_portal_profiles`**
10. Pré-paiement : `saveAppointmentToSupabase` → **`inkflow_appointments`** (`pending`)
11. Formulaire santé → **`inkflow_health_forms`**
12. `lib/stripeClient.ts` → Edge **`create-checkout-session`** → Stripe
13. Retour `session_id` → Edge **`get-payment-session`**
14. Edge **`stripe-webhook`** → maj RDV/acompte, upsert **`inkflow_clients`**, **`send-payment-confirmation`**
15. **Branche projet** : `lib/supabaseProjectRequests.ts` → **`inkflow_project_requests`** + Edge **`send-project-notification`**

### 2. Gestion CRM d’un client (studio)

1. `App.tsx` → `/dashboard` (auth)
2. `pages/DashboardPage.tsx` → `components/dashboard/DashboardPro.tsx`
3. `hooks/useSupabaseDashboard.ts`
4. **Clients** : `components/crm/ClientList*`, `ClientAddModal`, `ClientDetailModal`, `ClientCsvImport`, drawers preview
5. Lib : `getClientsFromSupabase` / `saveClientToSupabase` / notes / CSV → **`inkflow_clients`**
6. Consent depuis CRM : `ConsentSender` → `lib/sendConsentRequest.ts` → Edge **`send-consent-request`**
7. **Demandes** : `RequestsDashboard`, `AcceptProjectModal`
8. Accept : `lib/projectRequestActions.ts` → Edge **`project-request-accept`** → **`inkflow_project_requests`**
9. Confirm/refus booking : `saveAppointmentToSupabase` + Edges **`send-booking-confirmation`** / **`send-booking-refusal`**
10. Acompte inbox : **`create-checkout-session`** → **`stripe-webhook`**

**Trous visibles :** delete client lib sans UI ; `project-request-reject` peu/pas appelé depuis l’UI.

### 3. Consultation vitrine publique (`/studio/:slug`)

1. `App.tsx` → `/studio/:slug`
2. `pages/public/PublicStudioPagePro.tsx`
3. `hooks/useRealtimeSync.ts` (`useRealtimeVitrine`) → Realtime **`inkflow_vitrine_data`**
4. Thèmes : `StudioThemeRouter` + Classic/Vintage/Split…
5. Load : `getVitrineDataBySlugAsync` → RPC + **`inkflow_vitrine_data`** / **`inkflow_studios`**
6. Metrics : `lib/studioPublicMetrics.ts` → RPC `increment_studio_channel_view`
7. Avis : `lib/googlePlaces.ts` → Edge **`google-places`**
8. CTA Réserver → `/book/:slug` (parcours 1)
9. Projet in-page → **`inkflow_project_requests`** + **`send-project-notification`**
10. Pay flash vitrine → **`create-checkout-session`** → **`stripe-webhook`**

### 4. Signature d’un consentement digital

**Envoi (studio)**

1. UI : `ClientPreviewPanel` / `MessagingTab` / `ActivityCenterTab`
2. `components/consent/ConsentSender.tsx` + `lib/consentFormPresets.ts`
3. `lib/sendConsentRequest.ts` → Edge **`send-consent-request`**
4. Écrit **`inkflow_consent_forms`** ; lit RDV/studio ; email Resend / SMS
5. Optionnel : **`inkflow_messages`** + Edge **`send-message-notification`**

**Signature (client)**

1. `App.tsx` → `/consent/:id`
2. `pages/public/ConsentPage.tsx` → `ConsentFormSign`
3. RPC `get_consent_form_for_public_portal`
4. RPC `submit_consent_form_signature` → **`inkflow_consent_forms`**
5. Trigger SQL → note **`inkflow_clients`** + flag `consent_form_signed` sur **`inkflow_appointments`**
6. Alt. in-thread : `ConsentFormMessageCard` (mêmes RPCs)

---

## 7. Diagnostic App Store

### Web PWA (présent)

- `vite-plugin-pwa` + stratégie `injectManifest`, `public/sw.js`, `PWAUpdatePrompt`
- Manifest (plugin + `public/manifest.json`), icônes `pwa-*.png`, maskable 512
- `offline.html`, meta iOS dans `index.html`, apple-touch-icon 180
- ~24 splash `apple-splash-*.png` injectés au build
- Route `/installer`
- Icône 1024 `public/icon-ios-1024.png`

### Universal Links / well-known (présent mais **incomplet**)

- `public/.well-known/apple-app-site-association` : `appID` encore `REPLACE_WITH_APPLE_TEAM_ID.me.inkflow.studio`
- `assetlinks.json` : fingerprint Play encore placeholder
- Rewrite Vercel AASA OK ; Team ID existe dans `inkflow-mobile/eas.json` (`Z38CK66528`) **mais pas substitué** dans AASA applinks

### Inkflow Pro (`inkflow-mobile/`) — cible App Store

**Présent :** `app.json` (bundle, scheme, splash, usage strings caméra/photo/mic, remote-notification, associated domains), assets icon/splash, `eas.json` (submit IDs), WebView shell, Tap to Pay + Stripe Terminal, registration push.

**Manquant / non trouvé dans le code app :**

- Pas de `PrivacyInfo.xcprivacy` **first-party** (seulement sous `node_modules`)
- Pas de bundle ASC screenshots / App Privacy export dans le repo (docs roadmap « à finaliser »)
- AASA / assetlinks placeholders = frein Universal Links / handoff

### App client Expo (`apps/inkflow-client/`)

Présente mais **beaucoup plus minimale** (pas le même niveau plugins/privacy/associated domains que Pro). Surface **séparée** de la soumission Pro.

**Verdict code-only :** la PWA web est solide pour install-home ; la soumission App Store propre dépend du shell Expo Pro + **remplir les placeholders well-known** + privacy ASC — pas d’un rebuild Vite.

---

## 8. Recommandation finale

Les **fondations produit sont solides** : Vite+Supabase+Stripe+Edge couvrent booking, CRM, vitrine, consent, paiements et push de bout en bout. Ce n’est pas un prototype à jeter.

Ce qui fait « trop de fichiers » n’est pas l’architecture métier, c’est l’**accumulation** : ~7–8k lignes de pages client/vitrine/demo orphelines, dossiers satellites (Next `mon-app`, maquettes `mobile/`, skills, imports design), et quelques Edge/crons jamais branchés.

Priorité honnête : **nettoyer et recâbler** (supprimer orphelins, brancher ou virer les Edge morts, clarifier `/discover` vs `ClientDashboard`), pas réécrire les fondations. L’UI Pro a besoin de polish, mais le squelette data/routes/Edge tient — sauf le portail client full-app, volontairement (ou accidentellement) à moitié débranché.
