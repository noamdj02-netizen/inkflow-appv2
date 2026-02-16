-- InkFlow Dashboard - Tables Supabase
-- Exécuter dans Supabase Dashboard > SQL Editor

-- Studios (identifiant par email + slug)
CREATE TABLE IF NOT EXISTS inkflow_studios (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  studio_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vitrine data (JSONB)
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

CREATE INDEX IF NOT EXISTS idx_studios_slug ON inkflow_studios(slug);
CREATE INDEX IF NOT EXISTS idx_appointments_studio ON inkflow_appointments(studio_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON inkflow_appointments(date);
CREATE INDEX IF NOT EXISTS idx_clients_studio ON inkflow_clients(studio_id);
CREATE INDEX IF NOT EXISTS idx_flash_studio ON inkflow_flash_designs(studio_id);
