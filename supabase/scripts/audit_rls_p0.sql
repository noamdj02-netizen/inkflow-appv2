-- =============================================================================
-- InkFlow — Audit P0 (Supabase) : RLS, policies, storage
-- Exécuter dans : Supabase Studio → SQL → New query
-- Lecture seule : ne modifie aucune donnée ni schéma.
-- Côté dépôt : `npm run check:p0-supabase` = pas de clé service dans lib/pages/components/hooks
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Tables du schéma `public` : RLS activée ou non
--     Objectif : aucune table applicative sans RLS (sauf exception documentée).
-- -----------------------------------------------------------------------------
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  -- Exclure les tables système internes éventuelles
  AND c.relname NOT LIKE 'pg_%'
ORDER BY c.relname;

-- Tables public SANS RLS (à corriger en priorité)
SELECT
  c.relname AS table_name_sans_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND NOT c.relrowsecurity
ORDER BY c.relname;

-- -----------------------------------------------------------------------------
-- 2) Tables avec RLS ON mais sans aucune policy (souvent = personne n’accède
--    en prod, ou comportement piégeux selon rôle — à vérifier)
-- -----------------------------------------------------------------------------
SELECT
  c.relname AS table_rls_sans_policy
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity
  AND NOT EXISTS (
    SELECT 1
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = c.relname
  )
ORDER BY c.relname;

-- -----------------------------------------------------------------------------
-- 3) Détail des policies (public) — relire les USING / WITH CHECK
-- -----------------------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Policies INSERT sur `public` sans WITH CHECK explicite (à auditer : risque
-- d’insertion sans contrainte sur la ligne créée selon moteur / policy ALL)
SELECT
  tablename,
  policyname,
  cmd,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd IN ('INSERT', 'ALL')
  AND with_check IS NULL
ORDER BY tablename, policyname;

-- -----------------------------------------------------------------------------
-- 4) Storage : buckets + RLS sur `storage.objects`
--     (les politiques réelles sont sur storage.objects ; vérifier dans Studio)
-- -----------------------------------------------------------------------------
SELECT
  id AS bucket_id,
  name AS bucket_name,
  public AS is_public_bucket,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
ORDER BY name;

-- RLS sur la table système des objets storage
SELECT
  c.relname,
  c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'storage'
  AND c.relname = 'objects';

SELECT
  policyname,
  cmd,
  roles,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- -----------------------------------------------------------------------------
-- 5) Fonctions en `public` en SECURITY DEFINER (à relire : exécution privilégiée)
-- -----------------------------------------------------------------------------
SELECT
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS args,
  l.lanname AS language
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY p.proname;

-- Fin du script d’audit P0
-- Rappel : valider avec 2 comptes tatoueur test (A ne voit pas B) dans l’app.
