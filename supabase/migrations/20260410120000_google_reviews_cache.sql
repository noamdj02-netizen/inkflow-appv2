-- Cache des avis Google Places (serving vitrine + repli si l’API live échoue)
ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS google_reviews_cache JSONB;

COMMENT ON COLUMN inkflow_studios.google_reviews_cache IS
  'Avis Places mis en cache (rating, userRatingsTotal, reviews[], cachedAt) — rempli par la fonction edge google-places.';
