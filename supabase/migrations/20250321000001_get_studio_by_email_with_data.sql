-- InkFlow: RPC pour récupérer le studio d'un email en privilégiant celui avec le plus de données
-- Évite de sélectionner un studio vide quand l'utilisateur a plusieurs studios (ex: après migration)

CREATE OR REPLACE FUNCTION get_studio_by_email_with_data(p_email TEXT)
RETURNS TABLE (
  id TEXT,
  slug TEXT,
  subscription_status TEXT,
  trial_ends_at TIMESTAMPTZ,
  siret TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.slug::TEXT,
    s.subscription_status::TEXT,
    s.trial_ends_at,
    s.siret::TEXT
  FROM inkflow_studios s
  LEFT JOIN (
    SELECT studio_id, COUNT(*) AS cnt FROM inkflow_clients GROUP BY studio_id
  ) cl ON cl.studio_id = s.id
  LEFT JOIN (
    SELECT studio_id, COUNT(*) AS cnt FROM inkflow_appointments GROUP BY studio_id
  ) ap ON ap.studio_id = s.id
  WHERE s.email = p_email
  ORDER BY COALESCE(cl.cnt, 0) + COALESCE(ap.cnt, 0) DESC, s.updated_at DESC NULLS LAST
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION get_studio_by_email_with_data(TEXT) IS 'Retourne le studio avec le plus de clients/RDV pour cet email (évite studio vide si plusieurs studios)';
