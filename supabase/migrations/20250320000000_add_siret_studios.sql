-- ============================================================
-- InkFlow - SIRET pour les studios (MVP)
-- Obligatoire pour : facturation, mentions légales, Stripe
-- ============================================================

ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS siret TEXT;

COMMENT ON COLUMN inkflow_studios.siret IS 'Numéro SIRET du studio (14 chiffres) — facturation et mentions légales';

-- Exposer siret dans la RPC publique (vitrine) pour affichage mentions légales
DROP FUNCTION IF EXISTS public.get_studio_public_by_slug(text);

CREATE OR REPLACE FUNCTION public.get_studio_public_by_slug(p_slug text)
RETURNS TABLE(id text, name text, studio_name text, slug text, vitrine_theme text, siret text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT s.id, s.name, s.studio_name, s.slug, COALESCE(s.vitrine_theme, 'light'), s.siret
  FROM inkflow_studios s
  WHERE s.slug = p_slug
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_studio_public_by_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_studio_public_by_slug(text) TO authenticated;
