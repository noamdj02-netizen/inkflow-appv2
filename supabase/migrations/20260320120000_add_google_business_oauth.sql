-- Google Business Profile OAuth tokens (pour récupérer TOUS les avis via l'API officielle)
-- Les tokens ne sont jamais exposés côté client — uniquement accessibles via les Edge Functions.

ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS google_business_access_token  TEXT,
  ADD COLUMN IF NOT EXISTS google_business_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS google_business_token_expiry  BIGINT,
  ADD COLUMN IF NOT EXISTS google_business_location_name TEXT;

COMMENT ON COLUMN inkflow_studios.google_business_access_token  IS 'OAuth 2.0 access token Google Business Profile — jamais exposé côté client.';
COMMENT ON COLUMN inkflow_studios.google_business_refresh_token IS 'OAuth 2.0 refresh token Google Business Profile — jamais exposé côté client.';
COMMENT ON COLUMN inkflow_studios.google_business_token_expiry  IS 'Expiry timestamp (ms) du access token Google Business.';
COMMENT ON COLUMN inkflow_studios.google_business_location_name IS 'Nom de la fiche Google Business (ex: accounts/123/locations/456).';
