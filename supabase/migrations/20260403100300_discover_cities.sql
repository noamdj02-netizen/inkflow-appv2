-- Migration: pages villes pour SEO discover
CREATE TABLE IF NOT EXISTS inkflow_city_pages (
  slug              TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  department        TEXT,
  region            TEXT,
  lat               NUMERIC(9,6),
  lng               NUMERIC(9,6),
  artist_count      INTEGER DEFAULT 0,
  meta_description  TEXT,
  hero_image_url    TEXT,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Seed villes principales FR
INSERT INTO inkflow_city_pages (slug, name, department, region, lat, lng) VALUES
  ('paris',     'Paris',     '75', 'Île-de-France',   48.8566, 2.3522),
  ('lyon',      'Lyon',      '69', 'Auvergne-Rhône-Alpes', 45.7640, 4.8357),
  ('marseille', 'Marseille', '13', 'Provence-Alpes-Côte d''Azur', 43.2965, 5.3698),
  ('bordeaux',  'Bordeaux',  '33', 'Nouvelle-Aquitaine', 44.8378, -0.5792),
  ('toulouse',  'Toulouse',  '31', 'Occitanie',        43.6047, 1.4442),
  ('nantes',    'Nantes',    '44', 'Pays de la Loire', 47.2184, -1.5536),
  ('strasbourg','Strasbourg','67', 'Grand Est',        48.5734, 7.7521),
  ('lille',     'Lille',     '59', 'Hauts-de-France',  50.6292, 3.0573),
  ('rennes',    'Rennes',    '35', 'Bretagne',         48.1173, -1.6778),
  ('rouen',     'Rouen',     '76', 'Normandie',        49.4431, 1.0993),
  ('nice',      'Nice',      '06', 'Provence-Alpes-Côte d''Azur', 43.7102, 7.2620),
  ('montpellier','Montpellier','34','Occitanie',       43.6108, 3.8767)
ON CONFLICT (slug) DO NOTHING;

-- Trigger: sync vitrine_data → studio discover fields
CREATE OR REPLACE FUNCTION sync_studio_discover_fields()
RETURNS TRIGGER AS $$
DECLARE
  vdata JSONB := NEW.data;
BEGIN
  UPDATE inkflow_studios SET
    bio                 = vdata->>'bio',
    instagram           = vdata->>'instagram',
    portfolio_cover_url = (vdata->'photos'->0->>'url'),
    portfolio_preview   = COALESCE(
                            (SELECT jsonb_agg(p->'url')
                             FROM jsonb_array_elements(COALESCE(vdata->'photos', '[]'::jsonb)) AS p
                             LIMIT 3),
                            '[]'::jsonb
                          ),
    last_active_at      = NOW()
  WHERE id = NEW.studio_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_discover_fields ON inkflow_vitrine_data;
CREATE TRIGGER trg_sync_discover_fields
  AFTER INSERT OR UPDATE ON inkflow_vitrine_data
  FOR EACH ROW EXECUTE FUNCTION sync_studio_discover_fields();

-- Trigger: mise à jour artist_count dans city_pages
CREATE OR REPLACE FUNCTION update_city_artist_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.city_slug IS NOT NULL THEN
    UPDATE inkflow_city_pages
    SET artist_count = (
      SELECT COUNT(*) FROM inkflow_studios
      WHERE city_slug = NEW.city_slug AND is_discoverable = TRUE
    )
    WHERE slug = NEW.city_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_city_count ON inkflow_studios;
CREATE TRIGGER trg_update_city_count
  AFTER INSERT OR UPDATE OF city_slug, is_discoverable ON inkflow_studios
  FOR EACH ROW EXECUTE FUNCTION update_city_artist_count();
