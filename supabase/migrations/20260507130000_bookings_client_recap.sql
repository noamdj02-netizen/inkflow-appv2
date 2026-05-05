-- Page publique « récap RDV + acompte » : lien signé par token (non devinable).

ALTER TABLE public.inkflow_bookings
  ADD COLUMN IF NOT EXISTS client_recap_token TEXT UNIQUE;

ALTER TABLE public.inkflow_bookings
  ADD COLUMN IF NOT EXISTS recap_appointment_id TEXT REFERENCES public.inkflow_appointments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_client_recap_token
  ON public.inkflow_bookings(client_recap_token)
  WHERE client_recap_token IS NOT NULL;

COMMENT ON COLUMN public.inkflow_bookings.client_recap_token IS
  'Jeton opaque pour la page /rdv/merci/:token (récap + paiement acompte).';
COMMENT ON COLUMN public.inkflow_bookings.recap_appointment_id IS
  'RDV agenda lié à la demande vitrine pour encaissement acompte côté client.';

CREATE OR REPLACE FUNCTION public.get_booking_client_recap(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 32 THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'studioName', COALESCE(NULLIF(trim(s.studio_name), ''), s.name),
    'studioSlug', s.slug,
    'studioId', b.studio_id,
    'clientName', b.client_name,
    'clientEmail', b.client_email,
    'requestedDate', b.requested_date::text,
    'requestedTime', b.requested_time,
    'description', left(b.description, 2000),
    'threadId', b.id,
    'appointmentId', b.recap_appointment_id,
    'depositAmountEur', CASE
      WHEN a.deposit IS NOT NULL AND a.deposit > 0 THEN (a.deposit::numeric)::float
      ELSE NULL
    END,
    'depositPaid', COALESCE(a.deposit_paid, false),
    'priceEur', CASE
      WHEN a.price IS NOT NULL THEN (a.price::numeric)::float
      ELSE NULL
    END
  )
  INTO result
  FROM public.inkflow_bookings b
  INNER JOIN public.inkflow_studios s ON s.id = b.studio_id
  LEFT JOIN public.inkflow_appointments a ON a.id = b.recap_appointment_id
  WHERE b.client_recap_token = trim(p_token)
    AND b.status IN ('confirmed', 'accepted')
  LIMIT 1;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_booking_client_recap(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booking_client_recap(text) TO anon, authenticated;
