-- Résolution studio pour fil pr_* : l’id en base est le texte complet `pr_…`, pas le suffixe après `pr_`.

CREATE OR REPLACE FUNCTION public.get_public_message_studio_header(p_thread_id text)
RETURNS TABLE(
  id text,
  name text,
  studio_name text,
  slug text,
  avatar_url text,
  portfolio_cover_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    s.id,
    s.name,
    s.studio_name,
    s.slug,
    s.avatar_url,
    s.portfolio_cover_url
  FROM inkflow_studios s
  WHERE s.id = (
    SELECT COALESCE(
      (SELECT m.studio_id
       FROM inkflow_messages m
       WHERE m.thread_id = p_thread_id
         AND m.studio_id IS NOT NULL
       LIMIT 1),
      (SELECT pr.studio_id
       FROM inkflow_project_requests pr
       WHERE p_thread_id LIKE 'pr_%'
         AND pr.id = p_thread_id
       LIMIT 1),
      (SELECT bk.studio_id
       FROM inkflow_bookings bk
       WHERE p_thread_id LIKE 'bk_%'
         AND bk.id = p_thread_id
       LIMIT 1)
    )
  )
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_public_message_studio_header(text) IS
  'Données vitrine publiques pour le studio lié à un fil (messages, pr_*, bk_*) — pr.id = thread_id complet.';
