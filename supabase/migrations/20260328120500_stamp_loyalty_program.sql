-- Programme fidélité « carte à tampons » : X séances terminées = Y € offerts + code promo + email

-- Paramètres par studio (JSONB sur inkflow_studios)
ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS stamp_loyalty_settings JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN inkflow_studios.stamp_loyalty_settings IS
'{"enabled":true,"tattoosRequired":5,"rewardEuros":80} — X tatouages validés = Y euros, code promo unique + email.';

-- État par client (tampons dans le cycle en cours)
CREATE TABLE IF NOT EXISTS inkflow_client_stamp_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES inkflow_clients(id) ON DELETE CASCADE,
  stamps_in_cycle INTEGER NOT NULL DEFAULT 0 CHECK (stamps_in_cycle >= 0),
  total_completed_tattoos INTEGER NOT NULL DEFAULT 0 CHECK (total_completed_tattoos >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (studio_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_stamp_state_studio ON inkflow_client_stamp_state(studio_id);

-- Crédits déjà comptés par RDV (idempotence)
CREATE TABLE IF NOT EXISTS inkflow_stamp_appointment_credits (
  appointment_id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  credited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stamp_credits_studio ON inkflow_stamp_appointment_credits(studio_id);

-- Récompenses : code promo + statut
CREATE TABLE IF NOT EXISTS inkflow_stamp_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES inkflow_clients(id) ON DELETE CASCADE,
  client_email TEXT NOT NULL,
  promo_code TEXT NOT NULL UNIQUE,
  amount_euros INTEGER NOT NULL CHECK (amount_euros > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'redeemed', 'expired')),
  source_appointment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_stamp_rewards_studio_email ON inkflow_stamp_rewards(studio_id, lower(client_email));
CREATE INDEX IF NOT EXISTS idx_stamp_rewards_pending ON inkflow_stamp_rewards(studio_id, status) WHERE status = 'pending';

-- RLS
ALTER TABLE inkflow_client_stamp_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_stamp_appointment_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_stamp_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stamp_state_owner" ON inkflow_client_stamp_state;
DROP POLICY IF EXISTS "stamp_state_select" ON inkflow_client_stamp_state;
CREATE POLICY "stamp_state_select" ON inkflow_client_stamp_state FOR SELECT USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "stamp_state_insert" ON inkflow_client_stamp_state;
CREATE POLICY "stamp_state_insert" ON inkflow_client_stamp_state FOR INSERT WITH CHECK (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "stamp_state_update" ON inkflow_client_stamp_state;
CREATE POLICY "stamp_state_update" ON inkflow_client_stamp_state FOR UPDATE USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);

DROP POLICY IF EXISTS "stamp_credits_owner" ON inkflow_stamp_appointment_credits;
DROP POLICY IF EXISTS "stamp_credits_select" ON inkflow_stamp_appointment_credits;
CREATE POLICY "stamp_credits_select" ON inkflow_stamp_appointment_credits FOR SELECT USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "stamp_credits_insert" ON inkflow_stamp_appointment_credits;
CREATE POLICY "stamp_credits_insert" ON inkflow_stamp_appointment_credits FOR INSERT WITH CHECK (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);

DROP POLICY IF EXISTS "stamp_rewards_owner" ON inkflow_stamp_rewards;
DROP POLICY IF EXISTS "stamp_rewards_select" ON inkflow_stamp_rewards;
CREATE POLICY "stamp_rewards_select" ON inkflow_stamp_rewards FOR SELECT USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "stamp_rewards_insert" ON inkflow_stamp_rewards;
CREATE POLICY "stamp_rewards_insert" ON inkflow_stamp_rewards FOR INSERT WITH CHECK (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "stamp_rewards_update" ON inkflow_stamp_rewards;
CREATE POLICY "stamp_rewards_update" ON inkflow_stamp_rewards FOR UPDATE USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);

COMMENT ON TABLE inkflow_client_stamp_state IS 'Progression tampons fidélité par client / studio.';
COMMENT ON TABLE inkflow_stamp_appointment_credits IS 'Un RDV terminé = au plus une ligne (évite double comptage).';
COMMENT ON TABLE inkflow_stamp_rewards IS 'Codes promo générés quand le quota de tampons est atteint.';
