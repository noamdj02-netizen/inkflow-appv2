-- Lien projet ↔ RDV, paiements, idempotence webhooks Stripe, tokens push natifs, suivi email feedback

ALTER TABLE inkflow_appointments
  ADD COLUMN IF NOT EXISTS project_request_id TEXT REFERENCES inkflow_project_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_project_request ON inkflow_appointments(project_request_id)
  WHERE project_request_id IS NOT NULL;

ALTER TABLE inkflow_payments
  ADD COLUMN IF NOT EXISTS project_request_id TEXT REFERENCES inkflow_project_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payments_project_request ON inkflow_payments(project_request_id)
  WHERE project_request_id IS NOT NULL;

COMMENT ON COLUMN inkflow_appointments.project_request_id IS 'Demande de projet vitrine liée à ce RDV (acompte / chat).';
COMMENT ON COLUMN inkflow_payments.project_request_id IS 'Demande de projet associée au paiement (acompte projet).';

-- Idempotence brute des événements Stripe (évite doubles traitements / doubles emails)
CREATE TABLE IF NOT EXISTS inkflow_stripe_processed_events (
  id TEXT PRIMARY KEY,
  event_type TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table interne (écriture webhook service role uniquement) — pas de RLS pour éviter tout blocage.
ALTER TABLE inkflow_stripe_processed_events DISABLE ROW LEVEL SECURITY;

-- Push natif iOS/Android (préparation — FCM/APNs hors scope)
CREATE TABLE IF NOT EXISTS inkflow_native_device_tokens (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'unknown',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_native_device_tokens_user ON inkflow_native_device_tokens(user_id);

ALTER TABLE inkflow_native_device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "native_tokens_own" ON inkflow_native_device_tokens
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE inkflow_native_device_tokens IS 'Jetons device pour push natif futur (FCM/APNs) — distinct du Web Push VAPID.';

-- Suivi email feedback post-séance (évite doublons)
ALTER TABLE inkflow_appointments
  ADD COLUMN IF NOT EXISTS feedback_email_sent_at TIMESTAMPTZ;
