-- ============================================================
-- InkFlow - Sécurité : supprimer la fuite studios (lecture publique)
-- Remplace studios_public_read_by_slug (USING true) par une RPC
-- qui ne retourne que id, name, studio_name, slug (pas d'email).
-- ============================================================

-- 1. Fonction SECURITY DEFINER : lecture publique d'un studio par slug (colonnes non sensibles uniquement)
CREATE OR REPLACE FUNCTION public.get_studio_public_by_slug(p_slug text)
RETURNS TABLE(id text, name text, studio_name text, slug text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT s.id, s.name, s.studio_name, s.slug
  FROM inkflow_studios s
  WHERE s.slug = p_slug
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_studio_public_by_slug(text) IS
  'Lecture publique d''un studio par slug (vitrine). Ne retourne pas email. Utiliser à la place de SELECT direct sur inkflow_studios pour les pages non authentifiées.';

GRANT EXECUTE ON FUNCTION public.get_studio_public_by_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_studio_public_by_slug(text) TO authenticated;

-- 2. Supprimer la policy qui autorisait SELECT sur toute la table (fuite emails / tous les studios)
DROP POLICY IF EXISTS "studios_public_read_by_slug" ON inkflow_studios;

-- Les utilisateurs authentifiés gardent l'accès à leur propre studio via studios_select_own (email = JWT email).
-- Le frontend public doit appeler supabase.rpc('get_studio_public_by_slug', { p_slug: slug }) au lieu de .from('inkflow_studios').select().eq('slug', slug).
