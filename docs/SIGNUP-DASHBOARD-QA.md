# QA — Tunnel inscription → Dashboard (Dragons 1–12, focus auth / RLS)

Ce document sert de **parcours de référence** pour valider le flux critique : sans auth stable et sans droits RLS cohérents sur `inkflow_studios` / `inkflow_clients`, le reste du produit ne tient pas.

## Prérequis

- Variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` renseignées.
- Migrations Supabase appliquées (RLS production : `docs/SECURITY-AUDIT-RLS.md`).
- Compte email de test dédié (pas le compte démo local).

## Parcours A — Inscription email / mot de passe

| Étape | Action | Attendu | Si KO |
|-------|--------|---------|--------|
| A1 | `/signup` — créer un compte | Pas d’erreur brute Supabase | Vérifier redirect URL Auth, captcha, quotas |
| A2 | Email de confirmation (si activé) | Clic lien → session | Logs Auth Supabase |
| A3 | Première connexion après confirmation | Redirection vers `/dashboard` ou URL `redirectAfterLogin` | `AuthCallbackPage` + `ensureStudio` |
| A4 | Ligne `inkflow_studios` | `email` = JWT, `slug` unique | Contrainte `inkflow_studios_slug_key`, logs **Postgres** (23505) |
| A5 | Dashboard charge `studioId` | Pas d’état « studio vide » infini | `getStudioByEmail` / RPC `get_studio_by_email_with_data` |
| A6 | Liste clients / RDV | Lecture sans erreur RLS | Onglet **Logs** Supabase : `permission denied for table` |

## Parcours B — OAuth Google

| Étape | Action | Attendu |
|-------|--------|---------|
| B1 | `/login` → Google | Redirect OAuth OK |
| B2 | Callback `/auth/callback` | `ensureStudio` exécuté (voir réseau / logs) |
| B3 | Dashboard | Même contrôle que A5–A6 |

## Slug studio (unicité)

- **Création** : `ensureStudio` dans [`lib/supabaseDashboard.ts`](../lib/supabaseDashboard.ts) calcule un slug de base ; en cas de collision ou d’erreur **23505** sur `slug`, il **réessaie** avec un suffixe dérivé (jusqu’à 8 tentatives).
- **Changement manuel** : [`SlugSettings`](../components/settings/SlugSettings.tsx) utilise `checkSlugAvailable` ; en cas d’erreur RPC, le slug est traité comme **indisponible** (pas de faux « disponible »).

## Logs à surveiller (Supabase)

1. **Authentication** — événements signUp, signIn, erreurs `invalid_grant`.
2. **Postgres** — requêtes refusées (RLS), violations uniques sur `inkflow_studios.slug`.
3. **API Edge** — seulement si le flux passe par une fonction (ex. webhooks).

## Import clients (CSV)

- Données cibles : table **`inkflow_clients`** (schéma dans `types/database.ts` et migrations).
- UI : onglet **Clients** → **Importer CSV** ; respect de la **limite plan** (`csvImportRemainingSlots`).

## Références code

- Auth : [`contexts/AuthContext.tsx`](../contexts/AuthContext.tsx), [`pages/AuthCallbackPage.tsx`](../pages/AuthCallbackPage.tsx)
- Studio : [`lib/supabaseDashboard.ts`](../lib/supabaseDashboard.ts) (`ensureStudio`, `checkSlugAvailable`, `bulkInsertClientsToSupabase`)
- Import : [`lib/clientImportMapping.ts`](../lib/clientImportMapping.ts), [`hooks/useSupabaseDashboard.ts`](../hooks/useSupabaseDashboard.ts) (`importClientsFromCsvRows`)
