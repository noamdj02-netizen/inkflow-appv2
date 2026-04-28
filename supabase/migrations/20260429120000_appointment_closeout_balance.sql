-- Clôture séance : suivi solde encaissé + idempotence rappels push / créneau dépassé
ALTER TABLE public.inkflow_appointments
  ADD COLUMN IF NOT EXISTS balance_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS closeout_push_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS post_slot_nudge_sent_at timestamptz;

COMMENT ON COLUMN public.inkflow_appointments.balance_paid_at IS
  'Horodatage encaissement du solde (Checkout Stripe type balance) après acompte éventuel.';
COMMENT ON COLUMN public.inkflow_appointments.closeout_push_sent_at IS
  'Idempotence : push « clôture séance » envoyé une fois au passage completed.';
COMMENT ON COLUMN public.inkflow_appointments.post_slot_nudge_sent_at IS
  'Idempotence : rappel doux quand le créneau horaire est dépassé sans statut completed.';
