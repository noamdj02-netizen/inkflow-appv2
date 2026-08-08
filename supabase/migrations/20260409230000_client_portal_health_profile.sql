-- Questionnaire de santé réutilisable pour l'espace client (évite de le refaire à chaque réservation).

ALTER TABLE inkflow_client_portal_profiles
  ADD COLUMN IF NOT EXISTS health_profile JSONB,
  ADD COLUMN IF NOT EXISTS health_profile_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN inkflow_client_portal_profiles.health_profile IS
  'Données du questionnaire santé (réutilisé pour /book quand le client est connecté).';
