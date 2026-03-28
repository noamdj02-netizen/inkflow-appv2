-- ─────────────────────────────────────────────────────────────────────────────
-- Géolocalisation studios — lat/lng + Haversine RPC
-- Permet à l'espace client de découvrir les studios proches via GPS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS latitude         DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude        DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS city             TEXT,
  ADD COLUMN IF NOT EXISTS location_visible BOOLEAN NOT NULL DEFAULT true;

-- Index partiel pour accélérer les recherches géo
CREATE INDEX IF NOT EXISTS idx_studios_geo
  ON inkflow_studios (latitude, longitude)
  WHERE latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND location_visible = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC : studios proches avec formule Haversine (distance en km)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_nearby_studios(
  user_lat     DOUBLE PRECISION,
  user_lng     DOUBLE PRECISION,
  radius_km    DOUBLE PRECISION DEFAULT 50,
  limit_count  INTEGER          DEFAULT 20
)
RETURNS TABLE (
  id           TEXT,
  slug         TEXT,
  studio_name  TEXT,
  avatar_url   TEXT,
  city         TEXT,
  latitude     DOUBLE PRECISION,
  longitude    DOUBLE PRECISION,
  distance_km  DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.slug,
    s.studio_name,
    s.avatar_url,
    s.city,
    s.latitude,
    s.longitude,
    (
      6371.0 * acos(
        LEAST(1.0,
          cos(radians(user_lat)) * cos(radians(s.latitude))
          * cos(radians(s.longitude) - radians(user_lng))
          + sin(radians(user_lat)) * sin(radians(s.latitude))
        )
      )
    ) AS distance_km
  FROM inkflow_studios s
  WHERE
    s.latitude IS NOT NULL
    AND s.longitude IS NOT NULL
    AND s.location_visible = true
    AND s.subscription_status IN ('active', 'trialing')
    AND (
      6371.0 * acos(
        LEAST(1.0,
          cos(radians(user_lat)) * cos(radians(s.latitude))
          * cos(radians(s.longitude) - radians(user_lng))
          + sin(radians(user_lat)) * sin(radians(s.latitude))
        )
      )
    ) <= radius_km
  ORDER BY distance_km ASC
  LIMIT limit_count;
$$;

-- Accès public (lecture seule) : l'espace client n'a pas de session studio
GRANT EXECUTE ON FUNCTION get_nearby_studios TO anon, authenticated;
