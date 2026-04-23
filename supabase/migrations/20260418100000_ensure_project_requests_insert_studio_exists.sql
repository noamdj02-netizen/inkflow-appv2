-- Demande projet vitrine : l’INSERT public ne doit PAS utiliser
--   studio_id IN (SELECT id FROM inkflow_studios)
-- car depuis 202503091 les rôles anon/authenticated ne peuvent plus SELECT sur inkflow_studios
-- (plus de policy « lecture publique » sur toute la table — fuite d’emails).
-- La sous-requête renvoie alors 0 ligne → WITH CHECK échoue → « violates row-level security policy ».
--
-- Correction : policy d’INSERT basée sur public.studio_exists() (SECURITY DEFINER), comme inkflow_bookings.
-- Idempotent : réapplique fonction + policy si la base était partiellement migrée.

CREATE OR REPLACE FUNCTION public.studio_exists(sid text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.inkflow_studios WHERE id::text = sid);
$$;

GRANT EXECUTE ON FUNCTION public.studio_exists(text) TO anon, authenticated;

DROP POLICY IF EXISTS "project_requests_public_insert" ON public.inkflow_project_requests;
CREATE POLICY "project_requests_public_insert" ON public.inkflow_project_requests
  FOR INSERT
  WITH CHECK (
    studio_id IS NOT NULL
    AND trim(studio_id) <> ''
    AND public.studio_exists(studio_id)
  );
