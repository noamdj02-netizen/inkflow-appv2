-- Exposer avatar + couverture discover sur la RPC publique pour repli vitrine quand le JSON est incomplet.

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
    COALESCE(s.vitrine_theme, 'light'),
    s.siret,
    s.avatar_url,
    s.portfolio_cover_url
  FROM inkflow_studios s
  WHERE s.slug = p_slug
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_studio_public_by_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_studio_public_by_slug(text) TO authenticated;

COMMENT ON FUNCTION public.get_studio_public_by_slug(text) IS
  'Lecture publique studio par slug : id, métadonnées vitrine + URLs photo pour repli si inkflow_vitrine_data incomplet.';
