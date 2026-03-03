-- trial_ends_at et subscription_status sur inkflow_studios
-- Pour la période d'essai et le statut d'abonnement

-- 1. Colonne trial_ends_at : remplie automatiquement à now() + 14 jours à la création
ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days');

-- 2. Colonne subscription_status : 'trialing' par défaut
ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trialing'
  CONSTRAINT inkflow_studios_subscription_status_check
  CHECK (subscription_status IN ('trialing', 'active', 'restricted', 'canceled'));

-- 3. Backfill des studios existants : trial_ends_at = created_at + 14 jours
--    (évite de leur donner un nouveau trial de 14 jours)
UPDATE inkflow_studios
SET trial_ends_at = created_at + interval '14 days'
WHERE trial_ends_at IS NULL
   OR trial_ends_at > created_at + interval '14 days';

-- 4. Commentaires pour documentation
COMMENT ON COLUMN inkflow_studios.trial_ends_at IS 'Fin de la période d''essai (14 jours après création)';
COMMENT ON COLUMN inkflow_studios.subscription_status IS 'Statut abonnement : trialing | active | restricted | canceled';
