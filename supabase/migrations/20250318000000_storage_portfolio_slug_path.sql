-- ============================================================
-- InkFlow - Storage portfolio : accepter path par slug (mon-studio)
-- en plus de studio_id (email::slug) pour les anciens fichiers.
-- Les nouvelles images utilisent portfolio/<slug>/ pour des URLs propres.
-- ============================================================

DROP POLICY IF EXISTS "portfolio_insert_own_studio" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_delete_own_studio" ON storage.objects;

-- INSERT : autoriser soit studio_id soit slug (appartient au studio de l'utilisateur)
CREATE POLICY "portfolio_insert_own_studio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'portfolio'
    AND (
      (storage.foldername(name))[2] IN (
        SELECT id FROM inkflow_studios WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
      )
      OR (storage.foldername(name))[2] IN (
        SELECT slug FROM inkflow_studios WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
      )
    )
    AND storage.extension(name) IN ('jpg','jpeg','png','webp')
  );

-- DELETE : idem
CREATE POLICY "portfolio_delete_own_studio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'portfolio'
    AND (
      (storage.foldername(name))[2] IN (
        SELECT id FROM inkflow_studios WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
      )
      OR (storage.foldername(name))[2] IN (
        SELECT slug FROM inkflow_studios WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
      )
    )
  );
