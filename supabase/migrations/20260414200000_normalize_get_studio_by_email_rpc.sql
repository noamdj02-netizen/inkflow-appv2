-- RPC get_studio_by_email_with_data : comparaison d’e-mail insensible à la casse / espaces
-- Évite « Studio introuvable » (Stripe, dashboard) quand Auth et inkflow_studios diffèrent sur la casse.

DROP FUNCTION IF EXISTS public.get_studio_by_email_with_data(text);

CREATE FUNCTION get_studio_by_email_with_data(p_email TEXT)
RETURNS TABLE (
  id TEXT,
  slug TEXT,
  subscription_status TEXT,
  trial_ends_at TIMESTAMPTZ,
  siret TEXT,
  plan_type TEXT,
  csv_import_slots_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_email IS NULL OR trim(p_email) = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.slug::TEXT,
    s.subscription_status::TEXT,
    s.trial_ends_at,
    s.siret::TEXT,
    s.plan_type::TEXT,
    s.csv_import_slots_remaining
  FROM inkflow_studios s
  LEFT JOIN (
    SELECT studio_id, COUNT(*) AS cnt FROM inkflow_clients GROUP BY studio_id
  ) cl ON cl.studio_id = s.id
  LEFT JOIN (
    SELECT studio_id, COUNT(*) AS cnt FROM inkflow_appointments GROUP BY studio_id
  ) ap ON ap.studio_id = s.id
  WHERE lower(trim(s.email)) = lower(trim(p_email))
  ORDER BY COALESCE(cl.cnt, 0) + COALESCE(ap.cnt, 0) DESC, s.updated_at DESC NULLS LAST
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_studio_by_email_with_data(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_studio_by_email_with_data(text) TO authenticated;

COMMENT ON FUNCTION public.get_studio_by_email_with_data(text) IS
  'Retourne le studio le plus « actif » pour cet e-mail (comparaison email insensible à la casse).';
