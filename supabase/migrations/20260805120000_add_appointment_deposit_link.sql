-- Lien Stripe Checkout pour relances acompte (cron remind-unpaid-deposits).
-- Montant : colonne existante `deposit` (pas de deposit_amount dupliqué).

ALTER TABLE public.inkflow_appointments
  ADD COLUMN IF NOT EXISTS deposit_link TEXT DEFAULT NULL;

COMMENT ON COLUMN public.inkflow_appointments.deposit_link IS
  'URL Stripe Checkout (session.url) enregistrée à la création — utilisée par remind-unpaid-deposits.';

CREATE INDEX IF NOT EXISTS idx_appointments_deposit_link_pending
  ON public.inkflow_appointments (studio_id, deposit_paid, reminder_sent_at)
  WHERE deposit_paid = false AND deposit_link IS NOT NULL;
