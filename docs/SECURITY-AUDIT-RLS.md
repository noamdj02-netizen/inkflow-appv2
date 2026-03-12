# Audit Sécurité RLS & Multi-tenant — InkFlow

## 1. Modèle de données

- **Tenant** = un **studio** (`inkflow_studios`), identifié par `id` (format `email::slug`).
- **Propriétaire** = l’utilisateur dont l’email Supabase Auth correspond à `inkflow_studios.email`.
- Les tables sensibles sont liées par `studio_id` (ou `client_id` → `inkflow_clients` → `studio_id`).

## 2. Tables avec RLS activé (état actuel)

| Table | RLS | Policies propriétaire | Policies publiques |
|-------|-----|------------------------|--------------------|
| inkflow_studios | ✅ | studios_select_own, studios_insert_own, studios_update_own (email = JWT) | studios_public_read_by_slug **USING (true)** → **fuite** |
| inkflow_vitrine_data | ✅ | vitrine_data_owner | vitrine_data_public_read (true) — volontaire (vitrine) |
| inkflow_widgets | ✅ | widgets_owner | — |
| inkflow_vitrine_link_settings | ✅ | vitrine_link_owner | (voir migration vitrine_link_public_read) |
| inkflow_payment_settings | ✅ | payment_settings_owner | — |
| inkflow_care_templates | ✅ | care_templates_owner | — |
| inkflow_clients | ✅ | clients_owner | — |
| inkflow_client_notes | ✅ | client_notes_owner (via client → studio) | — |
| inkflow_appointments | ✅ | appointments_owner | — |
| inkflow_flash_designs | ✅ | flash_designs_owner | flash_designs_public_read (available = true) |
| inkflow_notifications | ✅ | notifications_owner | — |
| inkflow_project_requests | ✅ | project_requests_owner | project_requests_public_insert (WITH CHECK studio_exists) |
| inkflow_payments | ✅ | payments_owner | — |
| inkflow_subscriptions | ✅ | subscriptions_owner | — |
| inkflow_consent_forms | ✅ | consent_forms_owner | consent_forms_public_read (true), consent_forms_public_update (signature) |
| inkflow_reminder_logs | ✅ | reminder_logs_owner | — |
| inkflow_messages | ✅ | messages_owner | messages_public_insert (WITH CHECK studio_id + thread_id) ; lecture via get_public_thread_messages(thread_id) |
| inkflow_waitlist | ✅ | waitlist_owner | — |
| inkflow_artist_accounts | ✅ | artist_accounts_owner | — |
| inkflow_loyalty | ✅ | loyalty_owner | — |
| inkflow_bookings | ✅ | bookings_owner | bookings_public_insert (WITH CHECK studio_exists) |
| inkflow_push_subscriptions | ✅ | push_subscriptions_owner | — |
| instagram_connections | ✅ | instagram_connections_owner | — |
| instagram_messages | ✅ | instagram_messages_owner | — |

## 3. Problème critique identifié

- **`studios_public_read_by_slug`** avec **`USING (true)`** permet à un client **anon** de faire `SELECT * FROM inkflow_studios` et d’obtenir **tous les studios** (y compris **email**). C’est une **fuite de données multi-tenant**.

**Correctif** : supprimer cette policy et exposer la résolution « studio par slug » via une fonction **SECURITY DEFINER** qui ne retourne que des colonnes non sensibles (`id`, `name`, `studio_name`, `slug`), sans `email`. Le front public appelle alors `get_studio_public_by_slug(slug)` au lieu de lire la table directement.

## 4. Règles hermétiques (résumé)

- **Authentifié** : toutes les requêtes sur les tables studio-scopées passent par des policies du type  
  `studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')`.  
  Aucune donnée d’un autre studio n’est accessible.
- **Anon** :  
  - Insertions limitées (bookings, project_requests, messages) avec **WITH CHECK** sur `studio_id` (ex. `studio_exists(studio_id)`).  
  - Lecture « studio par slug » uniquement via **RPC** `get_studio_public_by_slug(slug)` (pas de SELECT direct sur `inkflow_studios`).

## 5. Bonnes pratiques côté front

- **Ne jamais faire confiance à un `studio_id` fourni par l’URL ou le state** pour charger des données sensibles.  
- Toujours utiliser le `studioId` issu de **`getStudioByEmail(user.email)`** ou le hook **`useSecureStudioId()`** (ID résolu côté backend via JWT). Le dashboard utilise ce pattern via `useSupabaseDashboard` ; pour n'avoir que l'ID studio : `useSecureStudioId()`.  
- Côté vitrine publique : utiliser **uniquement** `getStudioIdBySlug(slug)` qui s’appuie sur la RPC `get_studio_public_by_slug`.

## 6. Storage (Supabase Storage RLS)

- **Bucket `inkflow-assets`** : **avatars/** : policies restreignent INSERT/UPDATE/DELETE au studio du JWT (path avatars/<studio_id>). **booking-refs/** : INSERT anon pour vitrine. Migration : `20250309110000_storage_rls_avatar_owner.sql`.
