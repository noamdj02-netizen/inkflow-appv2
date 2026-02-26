-- ============================================================
-- InkFlow - Security Advisor fixes
-- Corrige : RLS "Always True", Function search_path
-- ============================================================

-- ===== 1. RLS — Remplacer les policies trop permissives =====

-- ---------- inkflow_bookings ----------
-- INSERT : au lieu de WITH CHECK (true), exiger un studio_id valide (évite les inserts arbitraires)
DROP POLICY IF EXISTS "bookings_public_insert" ON inkflow_bookings;
CREATE POLICY "bookings_public_insert" ON inkflow_bookings
  FOR INSERT
  WITH CHECK (
    studio_id IS NOT NULL
    AND studio_id IN (SELECT id FROM inkflow_studios)
  );

-- ---------- inkflow_project_requests ----------
-- INSERT : exiger un studio_id valide
DROP POLICY IF EXISTS "project_requests_public_insert" ON inkflow_project_requests;
CREATE POLICY "project_requests_public_insert" ON inkflow_project_requests
  FOR INSERT
  WITH CHECK (
    studio_id IS NOT NULL
    AND studio_id IN (SELECT id FROM inkflow_studios)
  );

-- SELECT : supprimer "USING (true)" — seul le propriétaire peut lire (policy project_requests_owner existe déjà)
DROP POLICY IF EXISTS "project_requests_client_read" ON inkflow_project_requests;

-- ---------- inkflow_messages ----------
-- INSERT : exiger studio_id et thread_id valides
DROP POLICY IF EXISTS "messages_public_insert" ON inkflow_messages;
CREATE POLICY "messages_public_insert" ON inkflow_messages
  FOR INSERT
  WITH CHECK (
    studio_id IS NOT NULL
    AND studio_id IN (SELECT id FROM inkflow_studios)
    AND thread_id IS NOT NULL
  );

-- SELECT : supprimer "USING (true)" — seul le propriétaire lit les messages (policy messages_owner existe déjà)
DROP POLICY IF EXISTS "messages_public_read" ON inkflow_messages;


-- ===== 2. Functions — Définir search_path pour éviter les appels ambigus =====
-- Applique search_path = public aux fonctions signalées par Security Advisor (si elles existent).

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema, p.proname AS name, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN ('update_updated_at_column', 'get_available_slots', 'get_monthly_revenue')
  LOOP
    EXECUTE format(
      'ALTER FUNCTION public.%I(%s) SET search_path = public',
      r.name,
      r.args
    );
  END LOOP;
END $$;
