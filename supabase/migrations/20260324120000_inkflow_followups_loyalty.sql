-- Journal des envois fidélité J+1 / J+7 / J+30 (aligné Edge send-loyalty-emails)
CREATE TABLE IF NOT EXISTS inkflow_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES inkflow_appointments(id) ON DELETE CASCADE,
  wave TEXT NOT NULL CHECK (wave IN ('j1', 'j7', 'j30')),
  client_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (appointment_id, wave)
);

CREATE INDEX IF NOT EXISTS idx_followups_studio_sent ON inkflow_followups(studio_id, sent_at DESC);

ALTER TABLE inkflow_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "followups_select_owner" ON inkflow_followups
  FOR SELECT USING (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

COMMENT ON TABLE inkflow_followups IS 'Historique des emails fidélité (J+1 soins, J+7 check-up, J+30 retour) — insert via service role uniquement.';
