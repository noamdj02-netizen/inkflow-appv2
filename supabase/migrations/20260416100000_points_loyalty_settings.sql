-- Programme « points / paliers » (UI LoyaltyManager) — distinct de stamp_loyalty_settings (tampons client)
-- (Renommé depuis 20260413120000 : collision avec grant_studio_free_noamdj02 — une seule entrée par version.)
ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS points_loyalty_settings JSONB DEFAULT NULL;

COMMENT ON COLUMN inkflow_studios.points_loyalty_settings IS
  'Configuration JSON du programme de points (LoyaltyManager) : seuils, récompenses, points/euro.';
