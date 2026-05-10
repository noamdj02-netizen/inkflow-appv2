# InkFlow — Statut MVP, inventaire web/mobile et audit

Document vivant : à mettre à jour après chaque release majeure. Généré selon le plan « Agents + audit MVP » (mars 2026).

**Go-live fondateur (« MVP fini ») :** [`MVP-FINI-ACTIONS-FOUNDATEUR.md`](./MVP-FINI-ACTIONS-FOUNDATEUR.md)

---

## 1. Verdict MVP (roadmap 29 mars)

| Critère (roadmap + usage réel)          | Statut                     | Détail                                                                                                                                      |
| --------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| CRM / fiches clients                    | **Partiel → proche**       | Dashboard + persistance Supabase ; voir [AUDIT-DASHBOARD.md](./AUDIT-DASHBOARD.md)                                                          |
| Agenda / RDV                            | **Partiel → proche**       | RDV + réservations côté web ; mobile : onglet calendrier (Expo)                                                                             |
| Lien réservation publique `/book/:slug` | **Fait (web)**             | Route dans `App.tsx` ; dépend config studio / créneaux                                                                                      |
| Vitrine publique `/studio/:slug`        | **Fait (web)**             | Thèmes vitrine dans le code ; roadmap historique mentionnait `/p/:slug` — **écart de nom d’URL**                                            |
| PWA / install                           | **À valider manuellement** | `manifest`, service worker selon config Vite ; tester sur `app` déployé                                                                     |
| Fidélité J+1 / J+7 / J+30               | **Partiel**                | Edge / emails partiels possibles ; dashboard : état surtout **local** selon [AUDIT-DASHBOARD.md](./AUDIT-DASHBOARD.md)                      |
| Messagerie dashboard                    | **Fait (web)**             | Chargement des fils depuis `inkflow_messages` dans `DashboardPro` + subscription Realtime ; voir [AUDIT-DASHBOARD.md](./AUDIT-DASHBOARD.md) |
| Rappels automatiques (SMS/email)        | **Partiel**                | Fonctions `send-appointment-reminders` etc. — valider prod + secrets                                                                        |
| App mobile Expo                         | **Partiel**                | Projet canonique sous `inkflow-mobile/` ; parité fonctionnelle ≠ web                                                                        |

**Synthèse :** le produit web est **utilisable comme démo SaaS avancée** ; au sens **roadmap stricte du 29 mars** (fidélité complète, rappels partout, polish device, vitrine `/p/...`), le statut est **MVP partiel — quelques blocs avant « prêt à vendre »**. La checklist §6 et le build CI confirment le reste.

---

## 2. Routes web (SPA `App.tsx`)

Source : [`App.tsx`](../App.tsx) (mars 2026).

| Chemin                                                                                                                             | Auth | Composant (lazy si applicable) | Notes                            |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------ | -------------------------------- |
| `/`                                                                                                                                | Non  | `LandingEnhanceAI`             | Landing marketing                |
| `/login`                                                                                                                           | Non  | `LoginPage`                    |                                  |
| `/signup`                                                                                                                          | Non  | `SignupPage`                   |                                  |
| `/installer`                                                                                                                       | Non  | `AddToHomeScreenPage`          | Regex avec slash final optionnel |
| `/invite/:code`                                                                                                                    | Non  | `InviteRedirectPage`           | `code` alphanum                  |
| `/reset-password`                                                                                                                  | Non  | `ResetPasswordPage`            |                                  |
| `/demo`, `/dashboard-demo`                                                                                                         | Non  | `DashboardDemoPage`            |                                  |
| `/vue-ensemble`, `/demandes`, `/rendez-vous`, `/galerie-flash`, `/clients`, `/messagerie`, `/portfolio`, `/finance`, `/parametres` | Non  | `FeatureDetailPage`            | Pages marketing par `slug`       |
| `/dashboard`                                                                                                                       | Oui  | `DashboardPage`                | `SupabaseSyncProvider`           |
| `/auth/callback`                                                                                                                   | Non  | `AuthCallbackPage`             |                                  |
| `/instagram/callback`                                                                                                              | Non  | `InstagramCallbackPage`        |                                  |
| `/auth/update-password`                                                                                                            | Non  | `UpdatePasswordPage`           |                                  |
| `/studio/:slug`                                                                                                                    | Non  | `PublicStudioPagePro`          | Vitrine publique                 |
| `/book/:slug`                                                                                                                      | Non  | `PublicBookingPage`            | Réservation publique             |
| `/consent/:consentId`                                                                                                              | Non  | `ConsentPage`                  |                                  |
| `/messages/:threadId`, `/c/:threadId`                                                                                              | Non  | `PublicMessagePage`            |                                  |
| `/reservation-succes`                                                                                                              | Non  | `ReservationSuccessPage`       |                                  |
| `/politique-confidentialite`, `/privacy`, `/privacy-policy`                                                                        | Non  | `PrivacyPolicyPage`            |                                  |
| `/conditions-utilisation`, `/terms`                                                                                                | Non  | `TermsOfServicePage`           |                                  |
| `/aide`                                                                                                                            | Non  | `AidePage`                     |                                  |
| `/referral`                                                                                                                        | Oui  | `ReferralPage`                 |                                  |
| _autre_                                                                                                                            | —    | `NotFoundPage`                 | 404                              |

**Sitemap :** [`scripts/generate-sitemap.mjs`](../scripts/generate-sitemap.mjs) — URLs statiques + `/studio/{slug}` et `/book/{slug}` si Supabase retourne des slugs.

---

## 3. App mobile (Expo Router)

### 3.1 Source de vérité

| Dossier                                     | Rôle                                                                                                            |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **[`inkflow-mobile/`](../inkflow-mobile/)** | **Canonique** — `npm run start` ici ; dépendances complètes (`expo-blur`, `lucide-react-native`, `moti`, etc.). |

**Stores (tatoueur) :** `app.json` → iOS `me.inkflow.studio`, Android même `package` ; `eas.json` pour EAS Build/Submit. App cliente : [`apps/inkflow-client/`](../apps/inkflow-client/) → `me.inkflow.client`.

_(L’ancien sous-dossier dupliqué `inkflow-mobile/inkflow-mobile/` a été retiré du dépôt.)_

### 3.2 Écrans (arborescence `inkflow-mobile/app/`)

| Route fichier         | Rôle                     |
| --------------------- | ------------------------ |
| `(tabs)/index.tsx`    | Accueil (Home)           |
| `(tabs)/calendar.tsx` | Calendrier               |
| `(tabs)/messages.tsx` | Messages                 |
| `(tabs)/profile.tsx`  | Profil                   |
| `(tabs)/_layout.tsx`  | Tabs + blur bar          |
| `referral.tsx`        | Parrainage (hors tabs)   |
| `modal.tsx`           | Modale                   |
| `_layout.tsx`         | Layout racine            |
| `+not-found.tsx`      | 404                      |
| `+html.tsx`           | HTML racine (web export) |

**Écart web vs mobile :** le web expose tout le dashboard (`DashboardPage`) ; l’app mobile couvre un **sous-ensemble** (navigation tabs + referral). Parité complète = hors scope MVP immédiat sauf décision produit.

---

## 4. Tables Supabase (`inkflow_*`) — inventaire code

Liste non exhaustive des tables référencées dans le repo (hooks, composants, Edge Functions) :

`inkflow_studios`, `inkflow_clients`, `inkflow_appointments`, `inkflow_bookings`, `inkflow_flash_designs`, `inkflow_notifications`, `inkflow_messages`, `inkflow_project_requests`, `inkflow_vitrine_data`, `inkflow_payments`, `inkflow_subscriptions`, `inkflow_referrals`, `inkflow_push_subscriptions`, `inkflow_reminder_logs`, `inkflow_calendar_integrations`.

**RLS / sécurité :** [SECURITY-AUDIT-RLS.md](./SECURITY-AUDIT-RLS.md).  
**Types TS :** `npm run db:types` — voir dette dans [CHECKLIST-PRODUCTION.md](./CHECKLIST-PRODUCTION.md).

---

## 5. Smoke HTTP (URLs publiques)

Script : [`scripts/smoke-urls.mjs`](../scripts/smoke-urls.mjs)  
Commande : `npm run smoke:urls` (variable `SMOKE_BASE_URL`, défaut `http://127.0.0.1:5173`).

**Ce que ça vérifie :** code HTTP (après redirection éventuelle) pour une liste de chemins **statiques** alignés sur le sitemap.

**Limites (important) :**

- Pas d’auth : `/dashboard`, `/referral` renverront redirection ou 200 login — interpréter selon comportement SPA.
- Pas de validation des **paramètres dynamiques** (`/studio/x`, `/book/x`) sans slugs réels — ajouter `SMOKE_STUDIO_SLUG` optionnel dans le script si besoin.
- Ne remplace pas les **tests E2E** (clics, formulaires, Stripe, webhooks).

---

## 6. Parcours critiques — checklist manuelle

Cocher après test sur **mobile web** et **desktop** (et **Expo** si concerné). Colonne « Statut » : OK / KO / N/A.

| #   | Parcours                                                    | Statut    | Notes                                                    |
| --- | ----------------------------------------------------------- | --------- | -------------------------------------------------------- |
| 1   | Inscription + connexion                                     | À valider |                                                          |
| 2   | Dashboard : vue d’ensemble charge sans erreur console       | À valider | Supabase requis pour données réelles                     |
| 3   | Créer ou modifier un client                                 | À valider |                                                          |
| 4   | Créer ou voir un RDV                                        | À valider |                                                          |
| 5   | Vitrine publique `/studio/{slug}` (vrai slug)               | À valider |                                                          |
| 6   | Réservation `/book/{slug}` → succès ou erreur métier claire | À valider |                                                          |
| 7   | Lien acompte / Stripe (si activé)                           | À valider | Secrets Edge Functions                                   |
| 8   | Messagerie (liste + thread)                                 | À valider | Liste alimentée par Supabase ; tests manuels recommandés |
| 9   | Paramètres studio / vitrine sauvegardés                     | À valider |                                                          |
| 10  | PWA : install + refresh (pas de régression)                 | À valider |                                                          |
| 11  | Mobile : safe area, pas d’overflow horizontal body          | À valider |                                                          |
| 12  | App Expo : tabs + referral                                  | À valider | Depuis `inkflow-mobile/` uniquement                      |

### Exécution automatisée (2026-03-20)

| Contrôle                                                                                  | Résultat                                           |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `npm run build`                                                                           | OK                                                 |
| `npm run smoke:urls` avec `SMOKE_BASE_URL=http://127.0.0.1:4173` (serveur `vite preview`) | Tous les chemins statiques du script en **200 OK** |

Les lignes 1–12 du tableau ci-dessus restent **à cocher manuellement** (auth, Supabase, Stripe, appareils réels).

### Constats statiques (code / doc — sans exécution navigateur)

| Sujet                                                                    | Gravité      | Référence                                                                           |
| ------------------------------------------------------------------------ | ------------ | ----------------------------------------------------------------------------------- |
| Messagerie dashboard                                                     | OK (code)    | [AUDIT-DASHBOARD.md](./AUDIT-DASHBOARD.md) — valider en prod (Realtime, edge cases) |
| Fidélité / consentement / file d’attente : persistance surtout locale    | P2           | [AUDIT-DASHBOARD.md](./AUDIT-DASHBOARD.md)                                          |
| Types générés Supabase vs tables custom                                  | P2           | [CHECKLIST-PRODUCTION.md](./CHECKLIST-PRODUCTION.md)                                |
| Écran intermédiaire auth : fond clair (`bg-white`) sur redirection login | P3 → corrigé | [`App.tsx`](../App.tsx) — aligné fond sombre                                        |

---

## 7. Agents Cursor

Voir [AGENTS-INKFLOW.md](./AGENTS-INKFLOW.md) pour les trois personas (Dev/QA, Marketing/Produit, Design/UX).

---

## Historique

| Date       | Auteur                  | Changement                                                     |
| ---------- | ----------------------- | -------------------------------------------------------------- |
| 2026-03-20 | Plan Agents + audit MVP | Création document, inventaire routes, mobile, smoke, checklist |
| 2026-03-20 | CI locale               | `npm run build` + `smoke:urls` sur preview 4173 OK             |
