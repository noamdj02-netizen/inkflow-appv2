-- InkFlow - Payments, Subscriptions, Consent, Messages, Waitlist, Loyalty
-- Executer dans Supabase Dashboard > SQL Editor

-- ===== PHASE 1: Payments & Subscriptions =====

CREATE TABLE IF NOT EXISTS inkflow_payments (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES inkflow_appointments(id) ON DELETE SET NULL,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL DEFAULT 'pending',
  type TEXT NOT NULL DEFAULT 'deposit',
  client_name TEXT,
  client_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_studio ON inkflow_payments(studio_id);
CREATE INDEX IF NOT EXISTS idx_payments_appointment ON inkflow_payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON inkflow_payments(status);

CREATE TABLE IF NOT EXISTS inkflow_subscriptions (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL DEFAULT 'solo',
  status TEXT NOT NULL DEFAULT 'trialing',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_studio ON inkflow_subscriptions(studio_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON inkflow_subscriptions(stripe_subscription_id);

-- ===== PHASE 2: Consent Forms & Reminder Logs =====

CREATE TABLE IF NOT EXISTS inkflow_consent_forms (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES inkflow_appointments(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  template TEXT NOT NULL,
  signature_data TEXT,
  signed_at TIMESTAMPTZ,
  client_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_studio ON inkflow_consent_forms(studio_id);
CREATE INDEX IF NOT EXISTS idx_consent_appointment ON inkflow_consent_forms(appointment_id);

CREATE TABLE IF NOT EXISTS inkflow_reminder_logs (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL REFERENCES inkflow_appointments(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_appointment ON inkflow_reminder_logs(appointment_id);

-- ===== PHASE 3: Messages, Waitlist, Artist Accounts =====

CREATE TABLE IF NOT EXISTS inkflow_messages (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'artist',
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON inkflow_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_studio ON inkflow_messages(studio_id);

CREATE TABLE IF NOT EXISTS inkflow_waitlist (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  desired_service TEXT,
  preferred_dates TEXT,
  notes TEXT,
  status TEXT DEFAULT 'waiting',
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_studio ON inkflow_waitlist(studio_id);

CREATE TABLE IF NOT EXISTS inkflow_artist_accounts (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'artist',
  avatar TEXT,
  specialties JSONB DEFAULT '[]',
  permissions JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artists_studio ON inkflow_artist_accounts(studio_id);

-- ===== PHASE 4: Loyalty =====

CREATE TABLE IF NOT EXISTS inkflow_loyalty (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES inkflow_clients(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze',
  referral_code TEXT,
  total_earned INTEGER DEFAULT 0,
  total_redeemed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_studio ON inkflow_loyalty(studio_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_client ON inkflow_loyalty(client_id);

-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE inkflow_messages;
