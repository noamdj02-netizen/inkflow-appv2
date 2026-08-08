-- Une seule ligne par slug public (évite les doublons si plusieurs enregistrements
-- inkflow_studios partagent le même slug, ex. tests + prod).

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
  WITH base AS (
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
  ),
  ranked AS (
    SELECT
      base.*,
      ROW_NUMBER() OVER (
        PARTITION BY lower(trim(base.slug))
        ORDER BY
          CASE
            WHEN user_lat IS NULL OR user_lng IS NULL THEN 0
            WHEN base.latitude IS NULL OR base.longitude IS NULL THEN 2
            ELSE 1
          END ASC,
          base.distance_km ASC NULLS LAST,
          base.studio_name ASC
      ) AS rn
    FROM base
  )
  SELECT
    ranked.id,
    ranked.slug,
    ranked.studio_name,
    ranked.avatar_url,
    ranked.city,
    ranked.latitude,
    ranked.longitude,
    ranked.distance_km
  FROM ranked
  WHERE ranked.rn = 1
  ORDER BY
    CASE
      WHEN user_lat IS NULL OR user_lng IS NULL THEN 0
      WHEN ranked.latitude IS NULL OR ranked.longitude IS NULL THEN 2
      ELSE 1
    END ASC,
    ranked.distance_km ASC NULLS LAST,
    ranked.studio_name ASC
  LIMIT limit_count;
$$;

COMMENT ON FUNCTION get_discovery_studios_for_client IS
  'Liste studios client : actifs/trial ; un seul enregistrement par slug (doublons BDD exclus) ; tri par distance si GPS.';
