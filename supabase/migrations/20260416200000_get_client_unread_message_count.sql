-- Compteur messages non lus côté client (fil pr_/bk_ lié à l’e-mail du JWT).
-- Réservé aux sessions authentifiées : l’e-mail passé doit correspondre au JWT.

CREATE OR REPLACE FUNCTION public.get_client_unread_message_count(p_client_email text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
  jwt_email text;
BEGIN
  jwt_email := lower(btrim((auth.jwt() ->> 'email')));
  IF jwt_email IS NULL OR jwt_email = '' THEN
    RETURN 0;
  END IF;
  IF lower(btrim(p_client_email)) IS DISTINCT FROM jwt_email THEN
    RETURN 0;
  END IF;

  PERFORM set_config('row_security', 'off', true);

  SELECT COUNT(*)::integer INTO n
  FROM public.inkflow_messages m
  WHERE m.read = false
    AND m.sender_type <> 'client'
    AND (
      EXISTS (
        SELECT 1
        FROM public.inkflow_project_requests pr
        WHERE pr.id = m.thread_id
          AND lower(btrim(pr.client_email)) = jwt_email
      )
      OR EXISTS (
        SELECT 1
        FROM public.inkflow_bookings b
        WHERE b.id = m.thread_id
          AND lower(btrim(b.client_email)) = jwt_email
      )
    );

  RETURN COALESCE(n, 0);
END;
$$;

COMMENT ON FUNCTION public.get_client_unread_message_count(text) IS
  'Nombre de messages non lus (studio/système) pour les fils projet ou réservation du client — e-mail JWT requis.';

GRANT EXECUTE ON FUNCTION public.get_client_unread_message_count(text) TO authenticated;
