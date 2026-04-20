-- Suivi des e-mails séquencés onboarding (idempotence) + pas de PII hors e-mail studio.
ALTER TABLE inkflow_user_settings
  ADD COLUMN IF NOT EXISTS onboarding_welcome_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_reminder_profile_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_reminder_flash_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_reminder_stripe_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_reactivation_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_first_booking_celebration_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN inkflow_user_settings.onboarding_welcome_sent_at IS 'Email bienvenue onboarding (séquence automation)';
COMMENT ON COLUMN inkflow_user_settings.onboarding_reminder_profile_sent_at IS 'Relance profil vitrine 24h';
COMMENT ON COLUMN inkflow_user_settings.onboarding_reminder_flash_sent_at IS 'Relance premier flash 48h';
COMMENT ON COLUMN inkflow_user_settings.onboarding_reminder_stripe_sent_at IS 'Relance Stripe Connect 72h';
COMMENT ON COLUMN inkflow_user_settings.onboarding_reactivation_sent_at IS 'Email réactivation studio inactif 14j';
COMMENT ON COLUMN inkflow_user_settings.onboarding_first_booking_celebration_sent_at IS 'Félicitations première réservation';
