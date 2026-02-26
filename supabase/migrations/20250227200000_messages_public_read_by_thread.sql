-- Lecture publique des messages restreinte au thread : pas de SELECT direct sur la table.
-- Les clients appellent get_public_thread_messages(thread_id) pour ne lire que les messages de ce fil.

CREATE OR REPLACE FUNCTION get_public_thread_messages(p_thread_id text)
RETURNS SETOF inkflow_messages
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM inkflow_messages WHERE thread_id = p_thread_id ORDER BY created_at ASC;
$$;

COMMENT ON FUNCTION get_public_thread_messages(text) IS 'Permet au public (anon) de lire les messages d''un seul thread par son id. Limite l''accès aux threads devinés.';

GRANT EXECUTE ON FUNCTION get_public_thread_messages(text) TO anon;
GRANT EXECUTE ON FUNCTION get_public_thread_messages(text) TO authenticated;
