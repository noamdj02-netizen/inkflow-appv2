-- Champs sync Dashboard → Vitrine → App client (MVP tour de contrôle)
-- Créé le 28 mars 2026

-- Flashs : mise en avant + ordre d’affichage
ALTER TABLE inkflow_flash_designs
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE inkflow_flash_designs
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_flash_featured_studio
  ON inkflow_flash_designs (studio_id, featured)
  WHERE featured = true AND available = true;

-- Artistes publics : dispo immédiate, Instagram, rayon
ALTER TABLE inkflow_artists
  ADD COLUMN IF NOT EXISTS available_now BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE inkflow_artists
  ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE inkflow_artists
  ADD COLUMN IF NOT EXISTS service_radius_km INTEGER NOT NULL DEFAULT 25;

-- Coordonnées studio : utiliser latitude / longitude (migration 20260328120000_add_geo_to_studios.sql)
