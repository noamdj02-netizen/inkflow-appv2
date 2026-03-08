-- À exécuter dans Supabase SQL Editor si le formulaire vitrine affiche :
-- - "reference_images column not found" → ajout de la colonne
-- - "new row violates row-level security policy" → GRANT EXECUTE pour studio_exists

-- 1. Colonne reference_images (URLs des images de référence)
ALTER TABLE inkflow_bookings ADD COLUMN IF NOT EXISTS reference_images JSONB DEFAULT '[]';

-- 2. Anon doit pouvoir exécuter studio_exists pour que la politique RLS passe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'studio_exists') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.studio_exists(text) TO anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.studio_exists(text) TO authenticated';
  END IF;
END $$;
