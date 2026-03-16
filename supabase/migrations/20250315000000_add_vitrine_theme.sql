-- Colonne vitrine_theme sur inkflow_studios pour le thème de la page vitrine
ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS vitrine_theme TEXT DEFAULT 'light';

COMMENT ON COLUMN inkflow_studios.vitrine_theme IS 'Thème de la page vitrine : light, dark, vintage, neon';

-- Mettre à jour la RPC get_studio_public_by_slug pour retourner vitrine_theme
-- DROP requis car le type de retour change (ajout de vitrine_theme)
DROP FUNCTION IF EXISTS public.get_studio_public_by_slug(text);

CREATE OR REPLACE FUNCTION public.get_studio_public_by_slug(p_slug text)
RETURNS TABLE(id text, name text, studio_name text, slug text, vitrine_theme text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT s.id, s.name, s.studio_name, s.slug, COALESCE(s.vitrine_theme, 'light')
  FROM inkflow_studios s
  WHERE s.slug = p_slug
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_studio_public_by_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_studio_public_by_slug(text) TO authenticated;
