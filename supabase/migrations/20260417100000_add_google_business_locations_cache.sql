-- Cache des fiches Google Business pour éviter le quota 1/min sur My Business Account Management API.
-- La liste est remplie à la 1re fetch réussie, réutilisée aux ouvertures suivantes.
-- Un bouton "Rafraîchir" côté UI force un nouveau fetch (et réécrit la cache).

ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS google_business_locations_cache JSONB,
  ADD COLUMN IF NOT EXISTS google_business_locations_cached_at TIMESTAMPTZ;

COMMENT ON COLUMN inkflow_studios.google_business_locations_cache IS 'Cache JSON de la liste [{name,title,accountName}] des fiches Google Business. Évite de retaper l''API (quota 1/min).';
COMMENT ON COLUMN inkflow_studios.google_business_locations_cached_at IS 'Timestamp du dernier fetch réussi des fiches Google Business.';
