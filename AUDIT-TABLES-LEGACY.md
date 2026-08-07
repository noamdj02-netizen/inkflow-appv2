# Audit tables legacy — InkFlow

**Date :** 2026-08-05  
**Mode :** read-only — aucune modification proposée  
**Périmètre :** grep repo (`*.ts`, `*.tsx`, `*.js`, `*.mjs`, `*.sql`) avec limites de mot (PCRE2 `(?<![a-zA-Z0-9_])table(?![a-zA-Z0-9_])`) + recherche ciblée `.from('…')`, `FROM …`, `CREATE TABLE`.

**Rappel schéma actif :** `inkflow_*` (ex. `inkflow_bookings` ≠ `bookings`, pas de table `inkflow_artists` — collaborateurs = `inkflow_artist_accounts`).

---

## Synthèse

| Table                     | Statut code              | Fichiers (références table réelle) | Verdict                                |
| ------------------------- | ------------------------ | ---------------------------------- | -------------------------------------- |
| `artists`                 | Types générés uniquement | `types/database.ts`                | **SUPPRIMABLE SANS RISQUE** (côté app) |
| `bookings`                | Types générés uniquement | `types/database.ts`                | **SUPPRIMABLE SANS RISQUE** (côté app) |
| `flashs`                  | Types générés uniquement | `types/database.ts`                | **SUPPRIMABLE SANS RISQUE** (côté app) |
| `projects`                | Types générés uniquement | `types/database.ts`                | **SUPPRIMABLE SANS RISQUE** (côté app) |
| `customers`               | Types générés uniquement | `types/database.ts`                | **SUPPRIMABLE SANS RISQUE** (côté app) |
| `care_templates`          | Types générés uniquement | `types/database.ts`                | **SUPPRIMABLE SANS RISQUE** (côté app) |
| `stripe_transactions`     | Types générés uniquement | `types/database.ts`                | **SUPPRIMABLE SANS RISQUE** (côté app) |
| `payment_logs`            | Types générés uniquement | `types/database.ts`                | **SUPPRIMABLE SANS RISQUE** (côté app) |
| `artist_payment_settings` | Types générés uniquement | `types/database.ts`                | **SUPPRIMABLE SANS RISQUE** (côté app) |

**Constat global :** **0** appel Supabase `.from('nom_legacy')`, **0** requête SQL `FROM public.nom_legacy` / `CREATE TABLE` legacy dans `supabase/migrations/`. Les 9 tables n’apparaissent que dans **`types/database.ts`** (généré depuis le schéma remote) et dans des **métadonnées FK** internes à ce fichier.

**Hors repo :** les tables peuvent exister en prod (check-up 0 ligne) ; toute suppression BDD reste une décision infra séparée — ce rapport ne couvre que le **code**.

---

## Méthode

1. Grep PCRE2 nom exact (exclut `inkflow_bookings` quand on cherche `bookings`).
2. Grep `.from('table')`, `FROM table`, `REFERENCES table`, `CREATE TABLE … table`.
3. Classification : **actif** = exécuté au runtime vers Postgres ; **mort** = types/comments/UI homonyme.

---

## Détail par table

### `artists`

| Fichier             | Ligne(s)                  | Nature                                          | Actif ?               |
| ------------------- | ------------------------- | ----------------------------------------------- | --------------------- |
| `types/database.ts` | 87–146                    | Définition `Tables.artists` (Row/Insert/Update) | Non — types seulement |
| `types/database.ts` | 222, 271, 420, 3742, 3793 | `referencedRelation: 'artists'` (FK metadata)   | Non                   |

**Faux positifs (≠ table Postgres `artists`)** — ~90 occurrences :  
champ JSON vitrine `data.artists`, props React `artists: ArtistAccount[]`, section UI `#artists`, `PlanLimitKey: 'artists'`, i18n « tattoo artists », etc.  
Fichiers typiques : `VitrineSettings.tsx`, `DashboardPro.tsx`, `PublicStudioPagePro.tsx`, `lib/vitrineStorageDefault.ts`, `ArtistManager.tsx`.

**Verdict : SUPPRIMABLE SANS RISQUE** — aucune requête runtime. Équivalent métier : `inkflow_artist_accounts` + JSON vitrine `inkflow_vitrine_data`.

---

### `bookings`

| Fichier             | Ligne(s)   | Nature                                                       | Actif ? |
| ------------------- | ---------- | ------------------------------------------------------------ | ------- |
| `types/database.ts` | 147–239    | Définition `Tables.bookings`                                 | Non     |
| `types/database.ts` | 3641, 3800 | FK → `bookings` depuis `payment_logs`, `stripe_transactions` | Non     |

**Faux positifs (≠ table `bookings`)** :

- **`inkflow_bookings`** — schéma actif (`lib/supabaseBookings.ts`, Edge Functions, etc.)
- Colonne **`daily_briefs.bookings`** (INTEGER métrique) — `api/daily-brief.js`, `DailyBriefPage.tsx`
- Onglets UI `'bookings'` — `RequestsDashboard.tsx`, `DashboardPro.tsx`
- Commentaires migrations sur **`inkflow_bookings`** — ex. `20260412100000_fix_public_booking_rls.sql` L2 (commentaire « insert into bookings » mais SQL cible `inkflow_bookings` L19–26)
- Scripts seed variables JS nommées `bookings` — `scripts/seed-mockup-data.mjs`, `seed-demo-marketing.mjs`
- Feature flag string `'bookings'` — `lib/subscriptionGuard.ts`

**Verdict : SUPPRIMABLE SANS RISQUE** pour la table legacy. Ne pas confondre avec **`inkflow_bookings`** (encore utilisée).

---

### `flashs`

| Fichier             | Ligne(s) | Nature                     | Actif ? |
| ------------------- | -------- | -------------------------- | ------- |
| `types/database.ts` | 366–423  | Définition `Tables.flashs` | Non     |
| `types/database.ts` | 229      | FK `bookings` → `flashs`   | Non     |

**Faux positifs :** mot français « flashs » dans copy UI/i18n/emails ; migrations commentent les policies sur **`inkflow_flash_designs`** (`20250313000000_rls_production_hardening.sql` L204, L241).  
Schéma actif : **`inkflow_flash_designs`**.

**Verdict : SUPPRIMABLE SANS RISQUE**.

---

### `projects`

| Fichier             | Ligne(s)        | Nature                       | Actif ? |
| ------------------- | --------------- | ---------------------------- | ------- |
| `types/database.ts` | 3646–3752       | Définition `Tables.projects` | Non     |
| `types/database.ts` | 236, 3742, 3749 | FK metadata                  | Non     |

**Faux positifs :**

- Onglets / routes UI `'projects'` — `RequestsDashboard.tsx`, `DashboardPro.tsx`, `ClientList.tsx`
- **`inkflow_project_requests`** — schéma actif (`lib/supabaseProjectRequests.ts`, Edge `project-request-*`)
- Routes Vercel **`/api/projects/:id/accept|reject`** — proxy vers Edge Functions, pas table `projects`
- Colonnes `pending_projects` sur `daily_briefs`
- `lib/projectRequestActions.ts` — commentaires REST, impl = Edge Functions

**Verdict : SUPPRIMABLE SANS RISQUE** pour la table legacy. **`inkflow_project_requests`** reste le remplaçant actif.

---

### `customers`

| Fichier             | Ligne(s) | Nature                        | Actif ? |
| ------------------- | -------- | ----------------------------- | ------- |
| `types/database.ts` | 276–298  | Définition `Tables.customers` | Non     |
| `types/database.ts` | 3749     | FK `projects` → `customers`   | Non     |

**Faux positif notable :**

- `supabase/functions/create-portal-session/index.ts` L37 — URL **`https://api.stripe.com/v1/customers`** (API Stripe, pas Postgres).

**Verdict : SUPPRIMABLE SANS RISQUE**. CRM actif : **`inkflow_clients`**.

---

### `care_templates`

| Fichier             | Ligne(s) | Nature                             | Actif ? |
| ------------------- | -------- | ---------------------------------- | ------- |
| `types/database.ts` | 241–274  | Définition `Tables.care_templates` | Non     |
| `types/database.ts` | 271      | FK → `artists`                     | Non     |

**Faux positifs :** aucun homonyme significatif hors types.  
Schéma actif soins : **`inkflow_care_templates`**.

**Verdict : SUPPRIMABLE SANS RISQUE**.

---

### `stripe_transactions`

| Fichier             | Ligne(s)  | Nature                                     | Actif ? |
| ------------------- | --------- | ------------------------------------------ | ------- |
| `types/database.ts` | 3754–3803 | Définition + FK vers `artists`, `bookings` | Non     |

**Faux positifs :** aucun. Paiements actifs : **`inkflow_payments`** + webhooks Stripe.

**Verdict : SUPPRIMABLE SANS RISQUE**.

---

### `payment_logs`

| Fichier             | Ligne(s)  | Nature                       | Actif ? |
| ------------------- | --------- | ---------------------------- | ------- |
| `types/database.ts` | 3548–3643 | Définition + FK → `bookings` | Non     |

**Faux positifs :** aucun.

**Verdict : SUPPRIMABLE SANS RISQUE**.

---

### `artist_payment_settings`

| Fichier             | Ligne(s) | Nature                                      | Actif ? |
| ------------------- | -------- | ------------------------------------------- | ------- |
| `types/database.ts` | 36–85    | Définition `Tables.artist_payment_settings` | Non     |

**Faux positifs :** aucun.  
Paiements studio actifs : **`inkflow_payment_settings`**, Connect sur **`inkflow_studios`**.

**Verdict : SUPPRIMABLE SANS RISQUE**.

---

## Migrations SQL (repo)

Aucune migration versionnée ne contient `CREATE TABLE public.artists|bookings|flashs|…`.

Les mentions « bookings » / « flashs » dans les migrations sont des **commentaires** ou des policies sur tables **`inkflow_*`** :

| Fichier                                             | Ligne    | Contenu réel                                               |
| --------------------------------------------------- | -------- | ---------------------------------------------------------- |
| `20260412100000_fix_public_booking_rls.sql`         | 2, 19–26 | Commentaire générique ; SQL = `inkflow_bookings`           |
| `20250301150000_bookings_slot_unique_confirmed.sql` | 1, 5–7   | Index sur **`inkflow_bookings`**                           |
| `20250313000000_rls_production_hardening.sql`       | 204, 241 | Commentaires ; policies = **`inkflow_flash_designs`**      |
| `20260423140000_daily_briefs.sql`                   | 5        | Colonne métrique `bookings INTEGER` sur **`daily_briefs`** |

Les 9 tables legacy proviennent donc très probablement d’un **schéma remote antérieur** reflété dans `types/database.ts`, pas du historique migrations actuel du repo.

---

## Edge Functions & frontend

| Zone                                             | Résultat                   |
| ------------------------------------------------ | -------------------------- |
| `supabase/functions/**/*.ts`                     | **0** `.from('…legacy…')`  |
| `lib/`, `hooks/`, `components/`, `pages/`        | **0** `.from('…legacy…')`  |
| Types `Database['public']['Tables']['…legacy…']` | **0** usage typé explicite |

Seules les tables **`inkflow_*`** sont interrogées en runtime (ex. `inkflow_appointments`, `inkflow_payments`, `inkflow_bookings`, `inkflow_project_requests`).

---

## Graphe FK legacy (types uniquement)

D’après `types/database.ts`, le sous-graphe legacy (non utilisé par l’app) :

```
artists ← bookings, flashs, projects, care_templates, stripe_transactions, payment_logs, artist_payment_settings
customers ← projects
bookings ← payment_logs, stripe_transactions
flashs ← bookings
projects ← bookings
```

Toute suppression future en prod devra respecter l’ordre FK — **constat schéma seulement**, pas de plan de drop ici.

---

## Verdict final

Les **9 tables legacy sont orphelines côté code** : présentes dans le schéma typé Supabase, **jamais appelées** par le frontend ni les Edge Functions de ce dépôt. L’application repose entièrement sur **`inkflow_*`**.

**Risque résiduel (DOUTE infra, pas code) :**

- Objet SQL hors repo (cron externe, script manuel, dashboard Supabase) non détecté par grep
- Après drop prod : regénérer `types/database.ts` pour retirer les entrées mortes

**Recommandation audit (constat, pas action) :** les 9 tables sont **candidates à dépréciation** une fois confirmé en prod qu’aucun job externe ne les lit — le code InkFlow Vite actuel n’en dépend pas.
