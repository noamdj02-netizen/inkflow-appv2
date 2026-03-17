-- ============================================================
-- InkFlow - Storage RLS : dossier portfolio pour les studios
-- Path: portfolio/<studio_id>/<filename>.<ext>
-- ============================================================

DROP POLICY IF EXISTS "portfolio_insert_own_studio" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_select_public" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_delete_own_studio" ON storage.objects;

CREATE POLICY "portfolio_insert_own_studio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'portfolio'
    AND (storage.foldername(name))[2] IN (
      SELECT id FROM inkflow_studios WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
    )
    AND storage.extension(name) IN ('jpg','jpeg','png','webp')
  );

CREATE POLICY "portfolio_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'portfolio'
  );

CREATE POLICY "portfolio_delete_own_studio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'portfolio'
    AND (storage.foldername(name))[2] IN (
      SELECT id FROM inkflow_studios WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
    )
  );
