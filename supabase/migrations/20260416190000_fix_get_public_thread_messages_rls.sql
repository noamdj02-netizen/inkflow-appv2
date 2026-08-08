-- Lecture publique des messages d'un fil : en production, selon le propriétaire de la
-- fonction, le SELECT sous RLS peut échouer alors que get_public_message_studio_header
-- fonctionne (résolution studio via pr_/bk_ sans ligne inkflow_messages).
-- Désactive row_security pour le corps de cette fonction uniquement (SECURITY DEFINER).

CREATE OR REPLACE FUNCTION public.get_public_thread_messages(p_thread_id text)
RETURNS SETOF inkflow_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('row_security', 'off', true);
  RETURN QUERY
    SELECT m.*
    FROM public.inkflow_messages m
    WHERE m.thread_id = p_thread_id
    ORDER BY m.created_at ASC;
END;
$$;

COMMENT ON FUNCTION public.get_public_thread_messages(text) IS
  'Lecture publique (anon) des messages d''un fil — row_security off dans le corps pour éviter un blocage RLS.';

GRANT EXECUTE ON FUNCTION public.get_public_thread_messages(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_thread_messages(text) TO authenticated;
