-- Lieu Google Maps (Place ID) pour afficher les avis sur la vitrine publique.
-- La clé API Places reste côté Edge Function uniquement.

ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS google_place_id TEXT;

COMMENT ON COLUMN inkflow_studios.google_place_id IS 'Google Place ID (Places API) pour avis vitrine ; jamais exposer la clé API côté client.';
