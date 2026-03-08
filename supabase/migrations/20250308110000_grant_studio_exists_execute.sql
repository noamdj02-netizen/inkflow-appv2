-- Anon must be able to EXECUTE studio_exists for the RLS policy to pass.
-- Without this, WITH CHECK (public.studio_exists(studio_id)) fails for anon.
GRANT EXECUTE ON FUNCTION public.studio_exists(text) TO anon;
GRANT EXECUTE ON FUNCTION public.studio_exists(text) TO authenticated;
