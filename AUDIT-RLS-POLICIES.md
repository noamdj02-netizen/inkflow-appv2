# Audit RLS — 4 tables « RLS sans policy »

**Date :** 2026-08-06  
**Mode :** lecture seule — aucune modification appliquée  
**Périmètre :** accès runtime (Edge Functions, frontend, triggers SQL). Docs / types exclus sauf mention migration.

---

## Synthèse exécutive

| Table                             | Accès runtime                                     | Clé dominante                      | Policy RLS nécessaire ?                                                     |
| --------------------------------- | ------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------- |
| `inkflow_stripe_processed_events` | 1 Edge Function (insert)                          | **service_role**                   | **Non** — table interne webhook ; RLS désactivé volontairement en migration |
| `email_suppressions`              | 4 Edge Functions (select/upsert)                  | **service_role**                   | **Non** — modèle intentionnel « deny all sauf service_role » (migration)    |
| `inkflow_calendar_integrations`   | 1 Edge Function (select/update)                   | **service_role**                   | **Non** — tokens OAuth ; aucun accès client                                 |
| `inkflow_city_pages`              | Frontend Discover (select) + trigger SQL (update) | **anon / authenticated** (lecture) | **Oui** — SELECT public requis ; attention au trigger `artist_count`        |

---

## Tableau détaillé

| Table                             | Fichier                                                   | Opération                                                                     | Clé Supabase                                                                                                                                   | Besoin d'une policy RLS ?                                                      |
| --------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `inkflow_stripe_processed_events` | `supabase/functions/stripe-webhook/index.ts`              | INSERT (idempotence `event.id`)                                               | **service_role** (`SUPABASE_SERVICE_ROLE_KEY`, L281)                                                                                           | **Non**                                                                        |
| `email_suppressions`              | `supabase/functions/resend-webhook/index.ts`              | UPSERT (bounce/complaint)                                                     | **service_role** (L68–73)                                                                                                                      | **Non**                                                                        |
| `email_suppressions`              | `supabase/functions/email-marketing-unsubscribe/index.ts` | UPSERT (désinscription one-click)                                             | **service_role** (L56–60)                                                                                                                      | **Non**                                                                        |
| `email_suppressions`              | `supabase/functions/send-loyalty-emails/index.ts`         | SELECT (skip si email bloqué)                                                 | **service_role** (L115, L152–156)                                                                                                              | **Non**                                                                        |
| `email_suppressions`              | `supabase/functions/send-referral-notification/index.ts`  | SELECT (skip si email bloqué)                                                 | **service_role** (L33, L49–53)                                                                                                                 | **Non**                                                                        |
| `inkflow_calendar_integrations`   | `supabase/functions/google-calendar-webhook/index.ts`     | SELECT par `channel_id`                                                       | **service_role** (L25–32)                                                                                                                      | **Non**                                                                        |
| `inkflow_calendar_integrations`   | `supabase/functions/google-calendar-webhook/index.ts`     | UPDATE `last_synced_at`                                                       | **service_role** (L37–41)                                                                                                                      | **Non**                                                                        |
| `inkflow_city_pages`              | `lib/discover.ts` → `getActiveCities()`                   | SELECT (`is_active = true`, limit 12)                                         | **anon** (clé `VITE_SUPABASE_ANON_KEY` via `lib/supabase.ts` ; rôle PostgREST `anon` si visiteur non connecté, `authenticated` si session JWT) | **Oui** — SELECT public                                                        |
| `inkflow_city_pages`              | `lib/discover.ts` → `getCityPage()`                       | SELECT par `slug` + `is_active`                                               | **anon / authenticated** (idem)                                                                                                                | **Oui** — SELECT public                                                        |
| `inkflow_city_pages`              | `pages/discover/DiscoverHomePage.tsx`                     | Indirect — appelle `getActiveCities`                                          | **anon / authenticated**                                                                                                                       | **Oui** (via `lib/discover.ts`)                                                |
| `inkflow_city_pages`              | `pages/discover/DiscoverCityPage.tsx`                     | Indirect — appelle `getCityPage`                                              | **anon / authenticated**                                                                                                                       | **Oui** (via `lib/discover.ts`)                                                |
| `inkflow_city_pages`              | `pages/discover/DiscoverCityStylePage.tsx`                | Indirect — appelle `getCityPage`                                              | **anon / authenticated**                                                                                                                       | **Oui** (via `lib/discover.ts`)                                                |
| `inkflow_city_pages`              | `supabase/migrations/20260403100300_discover_cities.sql`  | UPDATE `artist_count` (trigger `trg_update_city_count` sur `inkflow_studios`) | **Rôle SQL de l'utilisateur déclencheur** (trigger `SECURITY INVOKER` — typiquement `authenticated` quand un tatoueur met à jour son studio)   | **Oui** — policy UPDATE ou trigger `SECURITY DEFINER` (voir § Recommandations) |
| `inkflow_city_pages`              | `supabase/migrations/20260403100300_discover_cities.sql`  | INSERT seed villes (migration one-shot)                                       | **postgres** (migration)                                                                                                                       | N/A (hors runtime)                                                             |

---

## État RLS documenté dans les migrations

| Table                             | Migration de référence                          | RLS en repo                                                                                                                                                 |
| --------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inkflow_stripe_processed_events` | `20260411120000_project_flow_stripe_native.sql` | **`DISABLE ROW LEVEL SECURITY`** — commentaire : « pas de RLS pour éviter tout blocage webhook »                                                            |
| `email_suppressions`              | `20260423140100_email_suppressions.sql`         | **RLS activé**, aucune policy, `GRANT … TO service_role` — commentaire : « accès refusé sauf service_role »                                                 |
| `inkflow_calendar_integrations`   | _(aucune CREATE TABLE dans le repo)_            | Table présente en prod (`types/database.tsexport`) ; pas de migration RLS trouvée                                                                           |
| `inkflow_city_pages`              | `20260403100300_discover_cities.sql`            | CREATE TABLE + seed ; **pas de `ENABLE ROW LEVEL SECURITY`** dans le repo — l’alerte advisor vient probablement d’un `ENABLE RLS` manuel ou d’un drift prod |

---

## Accès absents (vérifié)

- **Frontend** : aucun `.from('inkflow_stripe_processed_events'|'email_suppressions'|'inkflow_calendar_integrations')` hors `lib/discover.ts` pour `inkflow_city_pages`.
- **Edge Functions calendrier OAuth** : `google-calendar-auth` et `google-calendar-sync` utilisent **`inkflow_studios`** (colonnes Google), **pas** `inkflow_calendar_integrations`.
- **pg_cron** : aucune référence à ces 4 tables dans les migrations cron.
- **Autres Edge Functions** : pas d’accès à `email_suppressions` en dehors des 4 fichiers listés.

---

## Recommandations pour création de policies (fondateur)

### 1. `inkflow_stripe_processed_events` — ne pas ajouter de policy

- Accès **100 % service_role** (`stripe-webhook`).
- `service_role` **contourne RLS** même si RLS est activé sans policy.
- **Action advisor :** soit laisser `RLS DISABLED` (migration d’origine), soit `ENABLE RLS` sans policy = deny anon/authenticated (durcissement cosmétique, aucun impact runtime).

### 2. `email_suppressions` — ne pas ajouter de policy

- Design **volontaire** : liste de blocage marketing, jamais exposée au client.
- Les 4 Edge Functions passent par **service_role**.
- Ajouter une policy SELECT/INSERT pour `authenticated` serait une **régression sécurité** (fuite liste emails bloqués).

### 3. `inkflow_calendar_integrations` — ne pas ajouter de policy client

- Accès **100 % service_role** ; contient `access_token`, `refresh_token`, `app_password`.
- **RLS ON + zero policy** = comportement souhaité (deny anon/authenticated).
- Note : la table semble **peu alimentée** — OAuth Google actuel écrit dans `inkflow_studios`. Seul `google-calendar-webhook` lit/écrit ici (lookup `channel_id`). Vérifier en prod si des lignes existent ; sinon table legacy / future Apple sync.

### 4. `inkflow_city_pages` — **seule table nécessitant une policy**

**Lecture Discover (bloquée aujourd’hui si RLS ON sans policy) :**

```sql
CREATE POLICY "city_pages_public_read_active"
  ON public.inkflow_city_pages
  FOR SELECT
  TO anon, authenticated
  USING (is_active IS TRUE);
```

**Écriture `artist_count` (trigger sur `inkflow_studios`) :**

Le trigger `update_city_artist_count()` est `SECURITY INVOKER`. Si un tatoueur met à jour `city_slug` / `is_discoverable`, le trigger fait `UPDATE inkflow_city_pages` avec le rôle **authenticated** → échouera sans policy UPDATE.

**Option A (recommandée)** — trigger en `SECURITY DEFINER` (pas de policy UPDATE exposée) :

```sql
CREATE OR REPLACE FUNCTION public.update_city_artist_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
-- corps inchangé (migration 20260403100300)
$$;
```

**Option B** — policy UPDATE restrictive (plus fragile) :

```sql
CREATE POLICY "city_pages_update_artist_count_via_studio"
  ON public.inkflow_city_pages
  FOR UPDATE
  TO authenticated
  USING (
    slug IN (
      SELECT city_slug FROM inkflow_studios
      WHERE email = public.inkflow_jwt_email_norm()
    )
  );
```

_(Adapter si `inkflow_jwt_email_norm()` n’est pas le helper RLS standard du projet.)_

---

## Smoke test (fondateur — hors scope audit)

À exécuter manuellement (paiement Stripe réel / carte test) :

1. Résa flash → paiement → redirect `app.ink-flow.me/reservation-succes`
2. Annulation checkout ou carte `4000 0000 0000 0002` → créneau libéré
3. Stripe Dashboard → webhooks `checkout.session.expired` + `payment_intent.payment_failed` cochés

---

## Verdict final

| Table                             | Créer une policy ?                             |
| --------------------------------- | ---------------------------------------------- |
| `inkflow_stripe_processed_events` | **Non**                                        |
| `email_suppressions`              | **Non**                                        |
| `inkflow_calendar_integrations`   | **Non**                                        |
| `inkflow_city_pages`              | **Oui** — SELECT public + gérer UPDATE trigger |

L’alerte Supabase Advisor sur les 3 premières tables est un **faux positif produit** dans ce codebase : RLS sans policy + accès exclusivement `service_role` = comportement voulu. Seule `inkflow_city_pages` a un appel **anon/authenticated** direct côté frontend.
