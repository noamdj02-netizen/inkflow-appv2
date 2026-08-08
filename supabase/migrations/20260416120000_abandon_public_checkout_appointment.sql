-- Permet au client (anon) d’annuler un RDV « brouillon » si la session Stripe n’a pas pu être créée.
-- Vérifie l’e-mail pour limiter l’abus (ne supprime que si client_email correspond).

CREATE OR REPLACE FUNCTION public.abandon_public_checkout_appointment(p_id text, p_client_email text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count int;
BEGIN
  IF p_id IS NULL OR trim(p_id) = '' OR p_client_email IS NULL OR trim(p_client_email) = '' THEN
    RETURN 0;
  END IF;

  DELETE FROM inkflow_appointments
  WHERE id = trim(p_id)
    AND lower(trim(client_email)) = lower(trim(p_client_email))
    AND coalesce(deposit_paid, false) = false
    AND coalesce(status, 'pending') = 'pending';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.abandon_public_checkout_appointment(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.abandon_public_checkout_appointment(text, text) TO anon, authenticated;

COMMENT ON FUNCTION public.abandon_public_checkout_appointment(text, text) IS
  'Supprime un RDV pending non payé si l’e-mail correspond (échec tunnel paiement /book).';
