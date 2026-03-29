-- Table pour stocker les questionnaires de santé (données sensibles)
-- Les données sont protégées par RLS strict : seul le studio propriétaire peut lire

CREATE TABLE IF NOT EXISTS inkflow_health_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES inkflow_bookings(id) ON DELETE SET NULL,
  appointment_id TEXT REFERENCES inkflow_appointments(id) ON DELETE SET NULL,
  
  -- Informations client
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_birthdate DATE,
  client_instagram TEXT,
  
  -- Questions de santé (stockées en JSONB pour flexibilité)
  health_data JSONB NOT NULL DEFAULT '{}',
  
  -- Signature / certification
  signature_text TEXT,
  certified_accurate BOOLEAN NOT NULL DEFAULT false,
  certified_at TIMESTAMPTZ,
  
  -- Métadonnées
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_health_forms_studio ON inkflow_health_forms(studio_id);
CREATE INDEX IF NOT EXISTS idx_health_forms_email ON inkflow_health_forms(client_email);
CREATE INDEX IF NOT EXISTS idx_health_forms_booking ON inkflow_health_forms(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_health_forms_appointment ON inkflow_health_forms(appointment_id) WHERE appointment_id IS NOT NULL;

-- RLS strict : seul le studio propriétaire peut lire/modifier
ALTER TABLE inkflow_health_forms ENABLE ROW LEVEL SECURITY;

-- SELECT : studio propriétaire uniquement
DROP POLICY IF EXISTS "health_forms_select_owner" ON inkflow_health_forms;
CREATE POLICY "health_forms_select_owner" ON inkflow_health_forms
  FOR SELECT USING (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- INSERT : autorisé pour les clients anonymes (via service role ou anon avec validation)
-- Note: L'insertion côté client se fait via une Edge Function avec service_role
DROP POLICY IF EXISTS "health_forms_insert_anon" ON inkflow_health_forms;
CREATE POLICY "health_forms_insert_anon" ON inkflow_health_forms
  FOR INSERT WITH CHECK (true);

-- UPDATE : studio propriétaire uniquement
DROP POLICY IF EXISTS "health_forms_update_owner" ON inkflow_health_forms;
CREATE POLICY "health_forms_update_owner" ON inkflow_health_forms
  FOR UPDATE USING (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- DELETE : interdit (données médicales à conserver pour raisons légales)
-- Si nécessaire, ajouter une politique de soft-delete

COMMENT ON TABLE inkflow_health_forms IS 'Questionnaires de santé obligatoires avant paiement. Données sensibles protégées par RLS.';
COMMENT ON COLUMN inkflow_health_forms.health_data IS 'JSONB contenant: allergies, grossesse, allaitement, maladies_infectieuses, infections_virales, trouble_cicatriciel, diabete, antibiotiques, anti_inflammatoires, steroides, etc.';
