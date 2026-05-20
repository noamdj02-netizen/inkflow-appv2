-- Phase 2 activation : partage vitrine sync, relance acompte J+2, digest demandes tatoueur

ALTER TABLE inkflow_user_settings
  ADD COLUMN IF NOT EXISTS onboarding_vitrine_link_shared_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pending_inbox_digest_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN inkflow_user_settings.onboarding_vitrine_link_shared_at IS 'Jalon onboarding : lien vitrine marqué partagé (dashboard)';
COMMENT ON COLUMN inkflow_user_settings.pending_inbox_digest_sent_at IS 'Dernier email digest « demandes en attente » au tatoueur';

ALTER TABLE inkflow_appointments
  ADD COLUMN IF NOT EXISTS deposit_reminder_followup_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN inkflow_appointments.deposit_reminder_followup_sent_at IS '2e relance acompte client (après reminder_sent_at)';
