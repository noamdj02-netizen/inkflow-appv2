-- Migration: enrichissement inkflow_studios pour discover
ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS city         TEXT,
  ADD COLUMN IF NOT EXISTS city_slug    TEXT,
  ADD COLUMN IF NOT EXISTS country      TEXT DEFAULT 'FR',
  ADD COLUMN IF NOT EXISTS lat          NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS lng          NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS styles       TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS price_min    INTEGER,
  ADD COLUMN IF NOT EXISTS price_max    INTEGER,
  ADD COLUMN IF NOT EXISTS bio          TEXT,
  ADD COLUMN IF NOT EXISTS instagram    TEXT,
  ADD COLUMN IF NOT EXISTS is_discoverable      BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS rating_avg           NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count         INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS portfolio_cover_url  TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_preview    JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS last_active_at       TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS discover_rank        INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_studios_city_slug
  ON inkflow_studios(city_slug);

CREATE INDEX IF NOT EXISTS idx_studios_styles
  ON inkflow_studios USING GIN(styles);

CREATE INDEX IF NOT EXISTS idx_studios_discoverable
  ON inkflow_studios(is_discoverable) WHERE is_discoverable = TRUE;

CREATE INDEX IF NOT EXISTS idx_studios_rank
  ON inkflow_studios(discover_rank DESC) WHERE is_discoverable = TRUE;

CREATE INDEX IF NOT EXISTS idx_studios_geo
  ON inkflow_studios(lat, lng) WHERE lat IS NOT NULL;
