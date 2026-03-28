-- ── Inkflow Sync : Vitrine + Client ────────────────────────────────────
-- Migration : synchronisation entre pages publiques (vitrine) et espace client
-- Créé le 28 mars 2026

-- ═══════════════════════════════════════════════════════════════════════
-- 1. Table "inkflow_artists" (profils tatoueurs publics avec slugs)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS inkflow_artists (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  studio_id     TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  bio           TEXT,
  avatar_url    TEXT,
  location_lat  NUMERIC(9,6),
  location_lng  NUMERIC(9,6),
  styles        TEXT[] DEFAULT '{}',
  years_exp     INTEGER DEFAULT 0,
  rating        NUMERIC(2,1) DEFAULT 5.0,
  tattoos_count INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_artists_slug ON inkflow_artists(slug);
CREATE INDEX IF NOT EXISTS idx_artists_studio ON inkflow_artists(studio_id);
CREATE INDEX IF NOT EXISTS idx_artists_active ON inkflow_artists(is_active) WHERE is_active = true;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Ajout colonne "slug" sur inkflow_flash_designs
-- ═══════════════════════════════════════════════════════════════════════
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inkflow_flash_designs' AND column_name = 'slug'
  ) THEN
    ALTER TABLE inkflow_flash_designs ADD COLUMN slug TEXT UNIQUE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inkflow_flash_designs' AND column_name = 'artist_id'
  ) THEN
    ALTER TABLE inkflow_flash_designs ADD COLUMN artist_id TEXT REFERENCES inkflow_artists(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_flash_slug ON inkflow_flash_designs(slug);
CREATE INDEX IF NOT EXISTS idx_flash_artist ON inkflow_flash_designs(artist_id);
CREATE INDEX IF NOT EXISTS idx_flash_available ON inkflow_flash_designs(available) WHERE available = true;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. Table "inkflow_client_favorites" (favoris des clients)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS inkflow_client_favorites (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_email TEXT NOT NULL,
  flash_id    TEXT NOT NULL REFERENCES inkflow_flash_designs(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (client_email, flash_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_client ON inkflow_client_favorites(client_email);
CREATE INDEX IF NOT EXISTS idx_favorites_flash ON inkflow_client_favorites(flash_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 4. Table "inkflow_client_artist_follows" (clients suivant des artistes)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS inkflow_client_artist_follows (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_email  TEXT NOT NULL,
  artist_id     TEXT NOT NULL REFERENCES inkflow_artists(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (client_email, artist_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_client ON inkflow_client_artist_follows(client_email);
CREATE INDEX IF NOT EXISTS idx_follows_artist ON inkflow_client_artist_follows(artist_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 5. RLS Policies
-- ═══════════════════════════════════════════════════════════════════════

-- Artists : lecture publique (vitrine), écriture par studio owner
ALTER TABLE inkflow_artists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artists_public_read" ON inkflow_artists
  FOR SELECT USING (is_active = true);

CREATE POLICY "artists_studio_write" ON inkflow_artists
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM inkflow_studios s 
      WHERE s.id = inkflow_artists.studio_id 
      AND s.email = auth.email()
    )
  );

CREATE POLICY "artists_svc" ON inkflow_artists
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Client Favorites
ALTER TABLE inkflow_client_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_client_read" ON inkflow_client_favorites
  FOR SELECT USING (client_email = auth.email());

CREATE POLICY "favorites_client_insert" ON inkflow_client_favorites
  FOR INSERT WITH CHECK (client_email = auth.email());

CREATE POLICY "favorites_client_delete" ON inkflow_client_favorites
  FOR DELETE USING (client_email = auth.email());

CREATE POLICY "favorites_svc" ON inkflow_client_favorites
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Client Artist Follows
ALTER TABLE inkflow_client_artist_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_client_read" ON inkflow_client_artist_follows
  FOR SELECT USING (client_email = auth.email());

CREATE POLICY "follows_client_insert" ON inkflow_client_artist_follows
  FOR INSERT WITH CHECK (client_email = auth.email());

CREATE POLICY "follows_client_delete" ON inkflow_client_artist_follows
  FOR DELETE USING (client_email = auth.email());

CREATE POLICY "follows_svc" ON inkflow_client_artist_follows
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Flash designs : lecture publique si disponible
DROP POLICY IF EXISTS "flash_public_read" ON inkflow_flash_designs;
CREATE POLICY "flash_public_read" ON inkflow_flash_designs
  FOR SELECT USING (available = true);

-- ═══════════════════════════════════════════════════════════════════════
-- 6. Fonction utilitaire : générer slug unique
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION generate_unique_slug(base_text TEXT, table_name TEXT, column_name TEXT DEFAULT 'slug')
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
  exists_check BOOLEAN;
BEGIN
  base_slug := lower(regexp_replace(base_text, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  
  LOOP
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE %I = $1)', table_name, column_name)
    INTO exists_check USING final_slug;
    
    EXIT WHEN NOT exists_check;
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;
