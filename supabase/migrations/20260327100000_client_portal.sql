-- ── Portail client "My Inkflow" ────────────────────────────────────────
-- Créé le 27 mars 2026

-- Wallet client (crédits de parrainage en centimes)
CREATE TABLE IF NOT EXISTS inkflow_client_wallets (
  email         TEXT PRIMARY KEY,
  balance_cents INTEGER NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Code parrainage unique par adresse client
CREATE TABLE IF NOT EXISTS inkflow_client_codes (
  email       TEXT PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Parrainages client-à-client
CREATE TABLE IF NOT EXISTS inkflow_client_referrals (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  referrer_email    TEXT NOT NULL,
  referee_email     TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','completed','cancelled')),
  discount_applied  BOOLEAN DEFAULT false,  -- -10€ appliqué au filleul
  referrer_credited BOOLEAN DEFAULT false,  -- +10€ crédité au parrain
  created_at        TIMESTAMPTZ DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  UNIQUE (referrer_email, referee_email)
);

-- RLS
ALTER TABLE inkflow_client_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_client_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_client_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_wallet_self"   ON inkflow_client_wallets FOR SELECT  USING (email = auth.email());
CREATE POLICY "client_wallet_svc"    ON inkflow_client_wallets FOR ALL     USING (auth.role()='service_role') WITH CHECK (auth.role()='service_role');

CREATE POLICY "client_code_self"     ON inkflow_client_codes   FOR SELECT  USING (email = auth.email());
CREATE POLICY "client_code_insert"   ON inkflow_client_codes   FOR INSERT  WITH CHECK (email = auth.email());
CREATE POLICY "client_code_svc"      ON inkflow_client_codes   FOR ALL     USING (auth.role()='service_role') WITH CHECK (auth.role()='service_role');

CREATE POLICY "client_ref_self"      ON inkflow_client_referrals FOR SELECT USING (referrer_email = auth.email() OR referee_email = auth.email());
CREATE POLICY "client_ref_insert"    ON inkflow_client_referrals FOR INSERT WITH CHECK (referrer_email = auth.email());
CREATE POLICY "client_ref_svc"       ON inkflow_client_referrals FOR ALL   USING (auth.role()='service_role') WITH CHECK (auth.role()='service_role');

-- Les clients peuvent lire leurs propres RDV et réservations
CREATE POLICY "client_apt_self"      ON inkflow_appointments FOR SELECT USING (client_email = auth.email());
CREATE POLICY "client_booking_self"  ON inkflow_bookings     FOR SELECT USING (client_email = auth.email());
