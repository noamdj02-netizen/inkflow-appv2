-- Colonne unlocked_themes : thèmes PRO achetés individuellement (2,99 € l'unité)
ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS unlocked_themes TEXT[] DEFAULT '{}';

COMMENT ON COLUMN inkflow_studios.unlocked_themes IS 'IDs des thèmes vitrine PRO débloqués par achat (ex: vintage, neon)';
