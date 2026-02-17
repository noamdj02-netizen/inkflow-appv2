-- ============================================================
-- InkFlow - Script SQL complet (Supabase)
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- Prérequis : variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
-- Multi-tenant : chaque table est liée au studio (studio_id).
-- RLS : le propriétaire est identifié par auth.jwt()->>'email' = inkflow_studios.email
-- Vitrine & Flash : lecture PUBLIQUE (clients voient la page), écriture propriétaire uniquement.
-- ============================================================

-- ===== 1. TABLES (CREATE IF NOT EXISTS) =====

CREATE TABLE IF NOT EXISTS inkflow_studios (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  studio_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inkflow_vitrine_data (
  studio_id TEXT PRIMARY KEY REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inkflow_widgets (
  studio_id TEXT PRIMARY KEY REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  widgets JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inkflow_vitrine_link_settings (
  studio_id TEXT PRIMARY KEY REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inkflow_payment_settings (
  studio_id TEXT PRIMARY KEY REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inkflow_care_templates (
  studio_id TEXT PRIMARY KEY REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  templates JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inkflow_clients (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  total_spent NUMERIC DEFAULT 0,
  appointments_count INTEGER DEFAULT 0,
  last_visit DATE,
  first_visit DATE NOT NULL,
  status TEXT DEFAULT 'active',
  tags JSONB DEFAULT '[]',
  tattoos JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inkflow_client_notes (
  client_id TEXT PRIMARY KEY REFERENCES inkflow_clients(id) ON DELETE CASCADE,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inkflow_appointments (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  client_id TEXT REFERENCES inkflow_clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  service TEXT NOT NULL,
  duration INTEGER DEFAULT 60,
  price NUMERIC DEFAULT 0,
  deposit NUMERIC DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',
  tattoo_type TEXT DEFAULT 'custom',
  flash_id TEXT,
  location TEXT,
  size TEXT,
  consent_form_signed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inkflow_flash_designs (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price NUMERIC DEFAULT 0,
  deposit_amount NUMERIC DEFAULT 0,
  available BOOLEAN DEFAULT TRUE,
  reserved BOOLEAN DEFAULT FALSE,
  category TEXT,
  size TEXT DEFAULT 'small',
  placement JSONB DEFAULT '[]',
  estimated_duration INTEGER DEFAULT 60,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inkflow_notifications (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings : demandes de RDV depuis la vitrine (Nom, Email, Idée, Dispo)
CREATE TABLE IF NOT EXISTS inkflow_bookings (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  description TEXT NOT NULL,
  requested_date DATE NOT NULL,
  requested_time TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_studios_slug ON inkflow_studios(slug);
CREATE INDEX IF NOT EXISTS idx_appointments_studio ON inkflow_appointments(studio_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON inkflow_appointments(date);
CREATE INDEX IF NOT EXISTS idx_clients_studio ON inkflow_clients(studio_id);
CREATE INDEX IF NOT EXISTS idx_flash_studio ON inkflow_flash_designs(studio_id);
CREATE INDEX IF NOT EXISTS idx_notifications_studio ON inkflow_notifications(studio_id);
CREATE INDEX IF NOT EXISTS idx_bookings_studio ON inkflow_bookings(studio_id);
CREATE INDEX IF NOT EXISTS idx_bookings_requested_date ON inkflow_bookings(requested_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON inkflow_bookings(status);

-- ===== 2. ROW LEVEL SECURITY (RLS) =====
-- Les tatoueurs ne voient/modifient QUE leurs données (studio dont email = JWT email).
-- Vitrine et Flash : lecture publique (page vitrine clients), écriture propriétaire.

ALTER TABLE inkflow_studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_vitrine_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_vitrine_link_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_care_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_flash_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_bookings ENABLE ROW LEVEL SECURITY;

-- Helper : studio détenu par l'utilisateur connecté (email JWT)
-- Supabase met l'email dans request.jwt.claims

DROP POLICY IF EXISTS "studios_select_own" ON inkflow_studios;
CREATE POLICY "studios_select_own" ON inkflow_studios
  FOR SELECT USING (email = (current_setting('request.jwt.claims', true)::json->>'email'));

DROP POLICY IF EXISTS "studios_insert_own" ON inkflow_studios;
CREATE POLICY "studios_insert_own" ON inkflow_studios
  FOR INSERT WITH CHECK (email = (current_setting('request.jwt.claims', true)::json->>'email'));

DROP POLICY IF EXISTS "studios_update_own" ON inkflow_studios;
CREATE POLICY "studios_update_own" ON inkflow_studios
  FOR UPDATE USING (email = (current_setting('request.jwt.claims', true)::json->>'email'));

DROP POLICY IF EXISTS "studios_public_read" ON inkflow_studios;
CREATE POLICY "studios_public_read" ON inkflow_studios FOR SELECT USING (true);

-- Vitrine : écriture propriétaire, LECTURE PUBLIQUE (page vitrine)
DROP POLICY IF EXISTS "vitrine_data_owner" ON inkflow_vitrine_data;
CREATE POLICY "vitrine_data_owner" ON inkflow_vitrine_data
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = (current_setting('request.jwt.claims', true)::json->>'email'))
  );
DROP POLICY IF EXISTS "vitrine_data_public_read" ON inkflow_vitrine_data;
CREATE POLICY "vitrine_data_public_read" ON inkflow_vitrine_data FOR SELECT USING (true);

DROP POLICY IF EXISTS "widgets_owner" ON inkflow_widgets;
CREATE POLICY "widgets_owner" ON inkflow_widgets
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = (current_setting('request.jwt.claims', true)::json->>'email'))
  );

DROP POLICY IF EXISTS "vitrine_link_owner" ON inkflow_vitrine_link_settings;
CREATE POLICY "vitrine_link_owner" ON inkflow_vitrine_link_settings
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = (current_setting('request.jwt.claims', true)::json->>'email'))
  );

DROP POLICY IF EXISTS "payment_settings_owner" ON inkflow_payment_settings;
CREATE POLICY "payment_settings_owner" ON inkflow_payment_settings
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = (current_setting('request.jwt.claims', true)::json->>'email'))
  );

DROP POLICY IF EXISTS "care_templates_owner" ON inkflow_care_templates;
CREATE POLICY "care_templates_owner" ON inkflow_care_templates
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = (current_setting('request.jwt.claims', true)::json->>'email'))
  );

DROP POLICY IF EXISTS "clients_owner" ON inkflow_clients;
CREATE POLICY "clients_owner" ON inkflow_clients
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = (current_setting('request.jwt.claims', true)::json->>'email'))
  );

DROP POLICY IF EXISTS "client_notes_owner" ON inkflow_client_notes;
CREATE POLICY "client_notes_owner" ON inkflow_client_notes
  FOR ALL USING (
    client_id IN (
      SELECT id FROM inkflow_clients
      WHERE studio_id IN (SELECT id FROM inkflow_studios WHERE email = (current_setting('request.jwt.claims', true)::json->>'email'))
    )
  );

DROP POLICY IF EXISTS "appointments_owner" ON inkflow_appointments;
CREATE POLICY "appointments_owner" ON inkflow_appointments
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = (current_setting('request.jwt.claims', true)::json->>'email'))
  );

-- Flash : écriture propriétaire, LECTURE PUBLIQUE (vitrine clients)
DROP POLICY IF EXISTS "flash_designs_owner" ON inkflow_flash_designs;
CREATE POLICY "flash_designs_owner" ON inkflow_flash_designs
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = (current_setting('request.jwt.claims', true)::json->>'email'))
  );
DROP POLICY IF EXISTS "flash_designs_public_read" ON inkflow_flash_designs;
CREATE POLICY "flash_designs_public_read" ON inkflow_flash_designs FOR SELECT USING (true);

DROP POLICY IF EXISTS "notifications_owner" ON inkflow_notifications;
CREATE POLICY "notifications_owner" ON inkflow_notifications
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = (current_setting('request.jwt.claims', true)::json->>'email'))
  );

-- Bookings : INSERT public (vitrine), SELECT/UPDATE propriétaire uniquement
DROP POLICY IF EXISTS "bookings_public_insert" ON inkflow_bookings;
CREATE POLICY "bookings_public_insert" ON inkflow_bookings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "bookings_owner" ON inkflow_bookings;
CREATE POLICY "bookings_owner" ON inkflow_bookings
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = (current_setting('request.jwt.claims', true)::json->>'email'))
  );

-- ===== 3. REALTIME (synchronisation temps réel) =====
-- Permet au dashboard de recevoir les changements (ex: RDV pris depuis la vitrine)

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE inkflow_appointments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE inkflow_clients;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE inkflow_flash_designs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE inkflow_notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE inkflow_vitrine_data;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE inkflow_widgets;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE inkflow_bookings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===== FIN =====
-- Vérifier : Supabase Dashboard > Database > Replication > supabase_realtime doit lister les tables ci-dessus.
