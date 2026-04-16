-- Fiche CRM : lien compte portail client + copie du questionnaire santé au moment du paiement (acompte).

ALTER TABLE inkflow_clients
  ADD COLUMN IF NOT EXISTS portal_user_id TEXT,
  ADD COLUMN IF NOT EXISTS health_profile_snapshot JSONB;

COMMENT ON COLUMN inkflow_clients.portal_user_id IS
  'auth.users.id du compte espace client (métadonnée Stripe client_portal_user_id), si connu.';
COMMENT ON COLUMN inkflow_clients.health_profile_snapshot IS
  'Copie JSON du questionnaire santé (portail ou inkflow_health_forms) synchronisée au paiement.';

CREATE INDEX IF NOT EXISTS inkflow_clients_studio_portal_user_idx
  ON inkflow_clients (studio_id, portal_user_id)
  WHERE portal_user_id IS NOT NULL;
