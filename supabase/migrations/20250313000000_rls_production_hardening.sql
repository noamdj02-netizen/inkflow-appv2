-- ============================================================
-- InkFlow — RLS Production Hardening
-- Isolation multi-tenant stricte : Studio A ne peut jamais accéder aux données de Studio B.
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ============================================================
-- Note : L'app utilise email (JWT) pour lier l'utilisateur à son studio.
-- inkflow_studios.id = format "email::slug", pas auth.uid().
-- ============================================================

-- ===== 1. INKFLOW_CLIENTS — Isolation totale par studio_id =====

ALTER TABLE inkflow_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_owner" ON inkflow_clients;
DROP POLICY IF EXISTS "clients_select_own" ON inkflow_clients;
DROP POLICY IF EXISTS "clients_insert_own" ON inkflow_clients;
DROP POLICY IF EXISTS "clients_update_own" ON inkflow_clients;
DROP POLICY IF EXISTS "clients_delete_own" ON inkflow_clients;

-- SELECT : uniquement les clients dont studio_id appartient à l'utilisateur connecté
CREATE POLICY "clients_select_own" ON inkflow_clients
  FOR SELECT
  USING (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = COALESCE(auth.jwt()->>'email', '')
    )
  );

-- INSERT : le studio_id doit être le sien
CREATE POLICY "clients_insert_own" ON inkflow_clients
  FOR INSERT
  WITH CHECK (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = COALESCE(auth.jwt()->>'email', '')
    )
  );

-- UPDATE : idem
CREATE POLICY "clients_update_own" ON inkflow_clients
  FOR UPDATE
  USING (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = COALESCE(auth.jwt()->>'email', '')
    )
  );

-- DELETE : idem
CREATE POLICY "clients_delete_own" ON inkflow_clients
  FOR DELETE
  USING (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = COALESCE(auth.jwt()->>'email', '')
    )
  );


-- ===== 2. INKFLOW_APPOINTMENTS — Isolation totale par studio_id =====

ALTER TABLE inkflow_appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments_owner" ON inkflow_appointments;
DROP POLICY IF EXISTS "appointments_select_own" ON inkflow_appointments;
DROP POLICY IF EXISTS "appointments_insert_own" ON inkflow_appointments;
DROP POLICY IF EXISTS "appointments_update_own" ON inkflow_appointments;
DROP POLICY IF EXISTS "appointments_delete_own" ON inkflow_appointments;

CREATE POLICY "appointments_select_own" ON inkflow_appointments
  FOR SELECT
  USING (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = COALESCE(auth.jwt()->>'email', '')
    )
  );

CREATE POLICY "appointments_insert_own" ON inkflow_appointments
  FOR INSERT
  WITH CHECK (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = COALESCE(auth.jwt()->>'email', '')
    )
  );

CREATE POLICY "appointments_update_own" ON inkflow_appointments
  FOR UPDATE
  USING (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = COALESCE(auth.jwt()->>'email', '')
    )
  );

CREATE POLICY "appointments_delete_own" ON inkflow_appointments
  FOR DELETE
  USING (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = COALESCE(auth.jwt()->>'email', '')
    )
  );


-- ===== 3. INKFLOW_PAYMENTS — Isolation totale par studio_id =====

ALTER TABLE inkflow_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_owner" ON inkflow_payments;
DROP POLICY IF EXISTS "payments_select_own" ON inkflow_payments;
DROP POLICY IF EXISTS "payments_insert_own" ON inkflow_payments;
DROP POLICY IF EXISTS "payments_update_own" ON inkflow_payments;
DROP POLICY IF EXISTS "payments_delete_own" ON inkflow_payments;

CREATE POLICY "payments_select_own" ON inkflow_payments
  FOR SELECT
  USING (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = COALESCE(auth.jwt()->>'email', '')
    )
  );

CREATE POLICY "payments_insert_own" ON inkflow_payments
  FOR INSERT
  WITH CHECK (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = COALESCE(auth.jwt()->>'email', '')
    )
  );

CREATE POLICY "payments_update_own" ON inkflow_payments
  FOR UPDATE
  USING (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = COALESCE(auth.jwt()->>'email', '')
    )
  );

CREATE POLICY "payments_delete_own" ON inkflow_payments
  FOR DELETE
  USING (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = COALESCE(auth.jwt()->>'email', '')
    )
  );


-- ===== 4. INKFLOW_STUDIOS — Un tatoueur ne modifie que sa propre ligne =====

ALTER TABLE inkflow_studios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "studios_select_own" ON inkflow_studios;
DROP POLICY IF EXISTS "studios_insert_own" ON inkflow_studios;
DROP POLICY IF EXISTS "studios_update_own" ON inkflow_studios;
DROP POLICY IF EXISTS "studios_public_read_by_slug" ON inkflow_studios;

-- SELECT : un tatoueur ne lit que sa propre ligne (email = JWT email)
CREATE POLICY "studios_select_own" ON inkflow_studios
  FOR SELECT
  USING (
    email = COALESCE(auth.jwt()->>'email', '')
  );

-- INSERT : création de son propre studio (signup)
CREATE POLICY "studios_insert_own" ON inkflow_studios
  FOR INSERT
  WITH CHECK (
    email = COALESCE(auth.jwt()->>'email', '')
  );

-- UPDATE : un tatoueur ne modifie que sa propre ligne
CREATE POLICY "studios_update_own" ON inkflow_studios
  FOR UPDATE
  USING (
    email = COALESCE(auth.jwt()->>'email', '')
  );

-- Pas de DELETE sur studios (éviter suppression accidentelle)

-- Lecture publique pour vitrine : via la RPC get_studio_public_by_slug uniquement.
-- On ne crée PAS de policy SELECT USING (true) pour éviter la fuite d'emails.
-- La fonction get_studio_public_by_slug (SECURITY DEFINER) expose id, name, studio_name, slug.


-- ===== 5. INKFLOW_FLASH_DESIGNS — Propriétaire CRUD + Public read (available) =====

ALTER TABLE inkflow_flash_designs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flash_designs_owner" ON inkflow_flash_designs;
DROP POLICY IF EXISTS "flash_designs_public_read" ON inkflow_flash_designs;
DROP POLICY IF EXISTS "flash_select_own" ON inkflow_flash_designs;
DROP POLICY IF EXISTS "flash_insert_own" ON inkflow_flash_designs;
DROP POLICY IF EXISTS "flash_update_own" ON inkflow_flash_designs;
DROP POLICY IF EXISTS "flash_delete_own" ON inkflow_flash_designs;
DROP POLICY IF EXISTS "flash_public_read_available" ON inkflow_flash_designs;

-- Propriétaire : SELECT, INSERT, UPDATE, DELETE sur ses propres flashs
CREATE POLICY "flash_select_own" ON inkflow_flash_designs
  FOR SELECT
  USING (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = COALESCE(auth.jwt()->>'email', '')
    )
  );

CREATE POLICY "flash_insert_own" ON inkflow_flash_designs
  FOR INSERT
  WITH CHECK (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = COALESCE(auth.jwt()->>'email', '')
    )
  );

CREATE POLICY "flash_update_own" ON inkflow_flash_designs
  FOR UPDATE
  USING (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = COALESCE(auth.jwt()->>'email', '')
    )
  );

CREATE POLICY "flash_delete_own" ON inkflow_flash_designs
  FOR DELETE
  USING (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = COALESCE(auth.jwt()->>'email', '')
    )
  );

-- Public (anonyme ou authentifié) : peut lire les flashs disponibles (vitrine)
-- Colonne "available" = TRUE (pas "reserved")
CREATE POLICY "flash_public_read_available" ON inkflow_flash_designs
  FOR SELECT
  USING (
    available = true
    AND (reserved = false OR reserved IS NULL)
  );


-- ===== 6. Vérification : aucune policy "USING (true)" sur les tables sensibles =====
-- Les policies ci-dessus garantissent l'isolation. Pour les Edge Functions (service_role),
-- elles bypassent RLS. Les clients anon/authenticated sont strictement filtrés.

COMMENT ON TABLE inkflow_clients IS 'RLS: isolation par studio_id (email JWT)';
COMMENT ON TABLE inkflow_appointments IS 'RLS: isolation par studio_id (email JWT)';
COMMENT ON TABLE inkflow_payments IS 'RLS: isolation par studio_id (email JWT)';
COMMENT ON TABLE inkflow_studios IS 'RLS: lecture/modif uniquement sur sa propre ligne (email JWT)';
COMMENT ON TABLE inkflow_flash_designs IS 'RLS: owner CRUD + public read si available=true';
