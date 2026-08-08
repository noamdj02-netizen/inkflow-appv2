-- Télé portable + consentement SMS (confirmations RDV vitrine via Twilio Edge).
ALTER TABLE public.inkflow_bookings
  ADD COLUMN IF NOT EXISTS client_phone TEXT,
  ADD COLUMN IF NOT EXISTS sms_confirmation_opt_in BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.inkflow_bookings.client_phone IS
  'Mobile client (formulaire vitrine), format libre ; normalisation E.164 côté Edge avant envoi SMS.';
COMMENT ON COLUMN public.inkflow_bookings.sms_confirmation_opt_in IS
  'Si true et secrets Twilio configurés, send-booking-confirmation peut envoyer un SMS transactionnel avec lien recap.';
