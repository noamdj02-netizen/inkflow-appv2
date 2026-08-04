# CLEANUP-REPORT

> Branche : `cleanup/dead-code-audit`  
> Date : 2026-08-05  
> Source : `AUDIT-INKFLOW.md` + re-vérification grep avant chaque suppression  
> **Pas de push / pas de merge** — à revoir en diff local.

---

## Bloc 1 — Fichiers supprimés

Tous les 14 fichiers listés ont passé la règle 2 : **aucun import / lazy import / référence runtime** dans `App.tsx`, `components/`, `pages/`, `lib/`, `hooks/`, `contexts/`.  
Mentions restantes uniquement dans docs / skills / audit (non bloquantes pour le build).

| Fichier                                         | Lignes | Vérification                                                                                                                                        |
| ----------------------------------------------- | -----: | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pages/public/ClientDashboard.tsx`              |   4203 | Export `ClientDashboard` jamais importé ; route `/discover` = `ClientAccountHubPage`                                                                |
| `pages/DemoSandboxPage.tsx`                     |   1692 | Export jamais routé (`/demo` → `DashboardDemoPage`). **Note :** `lib/demoSandboxData.ts` **conservé** (utilisé par `lib/inkflowDemoAccountData.ts`) |
| `pages/public/PublicStudioPage.tsx`             |    232 | Seul `PublicStudioPagePro` est lazy-loadé dans `App.tsx`                                                                                            |
| `pages/public/PublicBookingPagePro.tsx`         |    311 | Live = `PublicBookingPage`                                                                                                                          |
| `pages/client/ClientOnboardingFinalizePage.tsx` |    373 | Aucun import ; redirects legacy dans `App.tsx`                                                                                                      |
| `pages/client/ClientStudioEmbedPage.tsx`        |    180 | Aucun import                                                                                                                                        |
| `pages/client/ClientHealthOnboardingPage.tsx`   |    139 | Aucun import                                                                                                                                        |
| `pages/client/ClientFavoritesTab.tsx`           |    137 | Aucun import (même pas depuis l’ex-`ClientDashboard`)                                                                                               |
| `pages/client/ClientPortalLoginPage.tsx`        |    705 | Aucun import ; login client = hub                                                                                                                   |
| `pages/_error.tsx`                              |     17 | Résidu Next/Sentry ; exclu dans `tsconfig.json` (entrée exclude laissée telle quelle — hors liste)                                                  |
| `components/landing/LandingBelowFold.tsx`       |     23 | Aucun import                                                                                                                                        |
| `components/TrustedLogos.tsx`                   |     35 | Aucun import                                                                                                                                        |
| `components/Mascots.tsx`                        |    100 | Exports `InkDropMascot` / `ArtistMascot` nulle part ailleurs                                                                                        |
| `components/OnboardingBanner.tsx`               |    157 | Aucun import                                                                                                                                        |

### Total lignes supprimées

**8304 lignes** (somme `wc -l` avant suppression).

### Gardé par précaution (rien du bloc 1)

**Aucun fichier du bloc 1 n’a été gardé** — tous confirmés morts côté runtime.

Fichiers **connexes non touchés** (hors liste, volontairement) :

- `lib/clientDashboardRoutes.ts` — encore référencé en commentaire dans `lib/urls.ts` ; plus d’import TS depuis les pages mortes (candidat cleanup ultérieur)
- `lib/clientDashboardTheme.ts`, `lib/demoSandboxData.ts`
- `tsconfig.json` (exclude `pages/_error.tsx` / `mobile` / etc. inchangé)

---

## Bloc 2 — Dossiers hors produit (non supprimés)

| Dossier           | Taille (approx.)                     | Fichiers (approx.) | Référencé dans le build ?                                                                                                                       | Avis                                                                                                                                                                        |
| ----------------- | ------------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mon-app/`        | **~387 Mo** (surtout `node_modules`) | ~18k               | **Non** au build Vercel. Exclu de `tsconfig.json`. Pas de workspaces npm. CI = `npm ci` + lint/typecheck/build Vite racine uniquement.          | **Safe à sortir** du repo (archive / autre repo). Micro Next isolé, hors produit.                                                                                           |
| `mobile/`         | **~76 Ko**                           | 6                  | Exclu `tsconfig`. Pas de script package.json. Pas dans CI/vercel.                                                                               | **Safe à supprimer** ou archiver — maquettes RN (`HomeScreen`, `AgendaScreen`), pas le shell de prod (`inkflow-mobile/`).                                                   |
| `inkflow/`        | **~370 Mo** (surtout `node_modules`) | ~31k               | **Non** dans scripts prod / vercel / CI. Mini scaffold Expo legacy.                                                                             | **Safe à sortir** — ne pas confondre avec `inkflow-mobile/` (Pro) ni `apps/inkflow-client/`.                                                                                |
| `_design_import/` | **~52 Ko**                           | 2                  | Exclu `tsconfig`. Aucun import app.                                                                                                             | **Safe à supprimer** ou déplacer hors repo (draft design).                                                                                                                  |
| `_logo_variants/` | **~164 Ko**                          | 6                  | Aucune ref build/CI. Assets logo.                                                                                                               | **Safe à déplacer** vers brand assets externes ; inutile au runtime Vite.                                                                                                   |
| `_zip_10/`        | **~40 Ko**                           | 4                  | Aucune ref. Notes CSS scratch.                                                                                                                  | **Safe à supprimer**.                                                                                                                                                       |
| `video/`          | **~468 Mo**                          | ~9.8k              | **Oui, scripts optionnels** : `package.json` → `video:demo` / `video:demo:render` (`video/inkflow-demo`). Exclu `tsconfig`. Pas dans CI Vercel. | **Ne pas supprimer sans décision** — utile pour Remotion démo marketing. OK de **déplacer** hors monorepo si tu veux alléger le clone ; garder les scripts ou un submodule. |

**Ne pas toucher dans ce cleanup :** `inkflow-mobile/` (App Store Pro) — hors liste bloc 2.

---

## Bloc 3 — Edge functions ORPHAN (non supprimées du repo)

Re-vérification : grep sur tout le repo (frontend, `lib/`, `_shared`, migrations SQL, `config.toml`, docs).

### `remind-tattooer-pending-inbox`

| Check                                | Résultat                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| Caller `invoke` / `functions/v1/...` | **Aucun**                                                    |
| Migrations / pg_cron                 | **Aucun**                                                    |
| `_shared`                            | **Aucun**                                                    |
| `supabase/config.toml`               | Section `[functions.remind-tattooer-pending-inbox]` présente |

**Statut :** ORPHAN confirmé dans le code.  
**Action manuelle recommandée :** après vérif Dashboard Supabase (déployée ? cron externe ?) → désactiver / undeploy / supprimer côté projet Supabase, **puis** éventuellement retirer le dossier repo + entrée `config.toml` dans un PR dédié.

### `price-contribution-submit`

| Check                                | Résultat                                                                                                         |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Caller Edge depuis app               | **Aucun**                                                                                                        |
| Migrations qui appellent la function | **Aucun** (table `inkflow_price_contributions` + RLS existent ; insert UI via `lib/supabaseFinanceInventory.ts`) |
| Docs                                 | Listée dans `docs/CONFIGURATION.md`                                                                              |

**Statut :** ORPHAN côté invoke ; la **table** et le **chemin client insert** restent vivants.  
**Action manuelle recommandée :**

1. Vérifier sur Supabase si la function est déployée / appelée hors repo.
2. Soit **brancher** le dashboard sur cette Edge (plus sûr que insert client), soit **undeploy** + retirer le dossier plus tard.
3. Ne pas supprimer à l’aveugle du Dashboard sans avoir choisi l’option 2.

---

## Récap commit

- Branche : `cleanup/dead-code-audit`
- Contenu attendu du commit : 14 suppressions bloc 1 + ce `CLEANUP-REPORT.md`
- **Non inclus** volontairement : `AUDIT-INKFLOW.md`, changements `onboardingEmailLight.ts`, assets untracked, etc.
- Push : **aucun**
