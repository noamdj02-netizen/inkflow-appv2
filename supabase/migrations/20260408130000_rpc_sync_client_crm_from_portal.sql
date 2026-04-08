-- Propage nom + photo espace client vers les fiches CRM (inkflow_clients) pour tous les studios
-- où l’email correspond au JWT — automatisation côté tatoueur sans accès direct aux lignes CRM.

CREATE OR REPLACE FUNCTION public.sync_client_crm_from_portal(
  p_display_name text,
  p_avatar_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
BEGIN
  IF v_email = '' THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE public.inkflow_clients
  SET
    name = COALESCE(NULLIF(TRIM(p_display_name), ''), name),
    avatar_url = p_avatar_url,
    updated_at = now()
  WHERE lower(trim(email)) = v_email;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_client_crm_from_portal(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_client_crm_from_portal(text, text) TO authenticated;

COMMENT ON FUNCTION public.sync_client_crm_from_portal(text, text) IS
  'Appelé depuis l’espace client : aligne name + avatar_url sur toutes les fiches CRM dont l’email = JWT.';
