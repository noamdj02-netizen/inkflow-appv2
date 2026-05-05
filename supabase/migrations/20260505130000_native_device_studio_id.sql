-- Permet aux Edge Functions de résoudre les jetons Expo / natifs par studio
-- (titulaire ou collaborateur ayant branché les push depuis l'app enveloppe).

ALTER TABLE inkflow_native_device_tokens
  ADD COLUMN IF NOT EXISTS studio_id TEXT REFERENCES inkflow_studios(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_native_device_tokens_studio
  ON inkflow_native_device_tokens(studio_id)
  WHERE studio_id IS NOT NULL;

COMMENT ON COLUMN inkflow_native_device_tokens.studio_id IS
  'Studio InkFlow ciblé pour send-push-notification (App Expo / WebView). NULL = enregistrement legacy.';

COMMENT ON TABLE inkflow_native_device_tokens IS
  'Jetons device push natif (Expo) — distinct du Web Push VAPID. Colonne studio_id pour routage par studio.';
