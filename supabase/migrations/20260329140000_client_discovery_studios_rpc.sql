-- ─────────────────────────────────────────────────────────────────────────────
-- Découverte espace client : studios actifs même sans lat/lng
-- Avant : seul get_nearby_studios listait des studios → sans géo enregistrée = invisible
-- Ici : abonnement actif/trial + (dans le rayon si géo user) OU (studio sans coordonnées)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_discovery_studios_for_client(
  user_lat     DOUBLE PRECISION DEFAULT NULL,
  user_lng     DOUBLE PRECISION DEFAULT NULL,
  radius_km    DOUBLE PRECISION DEFAULT 120,
  limit_count  INTEGER          DEFAULT 40
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
      CASE
        WHEN user_lat IS NULL OR user_lng IS NULL THEN NULL::double precision
        WHEN s.latitude IS NULL OR s.longitude IS NULL THEN NULL::double precision
        ELSE (
          6371.0 * acos(
            LEAST(1.0,
              cos(radians(user_lat)) * cos(radians(s.latitude))
              * cos(radians(s.longitude) - radians(user_lng))
              + sin(radians(user_lat)) * sin(radians(s.latitude))
            )
          )
        )
      END
    ) AS distance_km
  FROM inkflow_studios s
  WHERE
    s.subscription_status IN ('active', 'trialing')
    AND s.slug IS NOT NULL
    AND trim(s.slug) <> ''
    AND (
      user_lat IS NULL
      OR user_lng IS NULL
      OR s.latitude IS NULL
      OR s.longitude IS NULL
      OR (
        6371.0 * acos(
          LEAST(1.0,
            cos(radians(user_lat)) * cos(radians(s.latitude))
            * cos(radians(s.longitude) - radians(user_lng))
            + sin(radians(user_lat)) * sin(radians(s.latitude))
          )
        )
      ) <= radius_km
    )
  ORDER BY
    CASE
      WHEN user_lat IS NULL OR user_lng IS NULL THEN 0
      WHEN s.latitude IS NULL OR s.longitude IS NULL THEN 2
      ELSE 1
    END ASC,
    distance_km ASC NULLS LAST,
    s.studio_name ASC
  LIMIT limit_count;
$$;

COMMENT ON FUNCTION get_discovery_studios_for_client IS
  'Liste studios pour l''app client : actifs/trial, visibles même sans GPS studio ; tri par distance si user partage sa position.';

GRANT EXECUTE ON FUNCTION get_discovery_studios_for_client TO anon, authenticated;
