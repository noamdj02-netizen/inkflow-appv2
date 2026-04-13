-- Programme « points / paliers » (UI LoyaltyManager) — distinct de stamp_loyalty_settings (tampons client)
ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS points_loyalty_settings JSONB DEFAULT NULL;

COMMENT ON COLUMN inkflow_studios.points_loyalty_settings IS
  'Configuration JSON du programme de points (LoyaltyManager) : seuils, récompenses, points/euro.';
