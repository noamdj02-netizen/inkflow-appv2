-- Essai studio : 1 mois (30 jours) pour les nouveaux comptes
ALTER TABLE inkflow_studios
  ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '30 days');

COMMENT ON COLUMN inkflow_studios.trial_ends_at IS 'Fin de la période d''essai (30 jours / 1 mois après création)';
