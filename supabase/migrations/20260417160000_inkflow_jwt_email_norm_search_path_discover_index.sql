-- Security Advisor : inkflow_jwt_email_norm() ne doit pas dépendre d’un search_path mutable.
CREATE OR REPLACE FUNCTION public.inkflow_jwt_email_norm()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT lower(trim(COALESCE(auth.jwt()->>'email', '')));
$$;

COMMENT ON FUNCTION public.inkflow_jwt_email_norm() IS
  'E-mail utilisateur depuis le JWT, normalisé (minuscules + trim) pour comparaisons RLS.';

-- Perf : la migration discover a tenté idx_studios_geo sur (lat,lng) mais le nom existait déjà
-- (index sur latitude/longitude). Index dédié pour les filtres discover sur lat/lng.
CREATE INDEX IF NOT EXISTS idx_studios_discover_lat_lng
  ON inkflow_studios (lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Storage (advisor « public bucket ») : inkflow-assets est volontairement public pour les URLs
-- d’avatars. Un passage en privé impose des URLs signées partout dans l’app — à traiter séparément.
