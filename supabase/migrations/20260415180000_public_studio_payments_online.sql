-- Expose si le studio peut encaisser en ligne (Stripe Connect prêt), sans données sensibles.
-- Utilisé par la page /book pour afficher un message avant le tunnel de paiement.

DROP FUNCTION IF EXISTS public.get_studio_public_by_slug(text);

CREATE OR REPLACE FUNCTION public.get_studio_public_by_slug(p_slug text)
RETURNS TABLE(
  id text,
  name text,
  studio_name text,
  slug text,
  vitrine_theme text,
  siret text,
  avatar_url text,
  portfolio_cover_url text,
  payments_online boolean
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
    COALESCE(s.vitrine_theme, 'light'),
    s.siret,
    s.avatar_url,
    s.portfolio_cover_url,
    (s.stripe_connect_charges_enabled IS TRUE AND s.stripe_connect_account_id IS NOT NULL AND btrim(s.stripe_connect_account_id) <> '')
  FROM inkflow_studios s
  WHERE lower(trim(s.slug)) = lower(trim(p_slug))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_studio_public_by_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_studio_public_by_slug(text) TO authenticated;

COMMENT ON FUNCTION public.get_studio_public_by_slug(text) IS
  'Lecture publique studio par slug (paiements en ligne = Stripe Connect prêt).';
