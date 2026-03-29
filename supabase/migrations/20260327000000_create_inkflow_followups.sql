-- Table de log des emails de fidélité envoyés (J+1, J+7, J+30)
-- Créée le 27 mars 2026 — requise par send-loyalty-emails edge function
CREATE TABLE IF NOT EXISTS inkflow_followups (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  studio_id       TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  appointment_id  TEXT NOT NULL REFERENCES inkflow_appointments(id) ON DELETE CASCADE,
  wave            TEXT NOT NULL CHECK (wave IN ('j1', 'j7', 'j30')),
  client_email    TEXT NOT NULL,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (appointment_id, wave)
);

CREATE INDEX IF NOT EXISTS idx_followups_studio
  ON inkflow_followups (studio_id, sent_at DESC);

ALTER TABLE inkflow_followups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Studio owner reads own followups" ON inkflow_followups;
CREATE POLICY "Studio owner reads own followups"
  ON inkflow_followups FOR SELECT
  USING (
    studio_id IN (
      SELECT id FROM inkflow_studios WHERE email = auth.email()
    )
  );

DROP POLICY IF EXISTS "Service role full access followups" ON inkflow_followups;
CREATE POLICY "Service role full access followups"
  ON inkflow_followups FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
