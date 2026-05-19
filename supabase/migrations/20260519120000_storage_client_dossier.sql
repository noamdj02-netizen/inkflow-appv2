-- PDF devis / factures / reçus — dossier client (inkflow-assets/client-dossier/{studio_id}/{client_id}/)

DROP POLICY IF EXISTS "client_dossier_insert_own_studio" ON storage.objects;
DROP POLICY IF EXISTS "client_dossier_update_own_studio" ON storage.objects;
DROP POLICY IF EXISTS "client_dossier_delete_own_studio" ON storage.objects;
DROP POLICY IF EXISTS "client_dossier_select_own_studio" ON storage.objects;

CREATE POLICY "client_dossier_insert_own_studio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'client-dossier'
    AND (storage.foldername(name))[2] IN (
      SELECT id FROM inkflow_studios
      WHERE lower(trim(email)) = lower(trim(COALESCE(auth.jwt()->>'email', '')))
    )
    AND storage.extension(name) = 'pdf'
  );

CREATE POLICY "client_dossier_update_own_studio"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'client-dossier'
    AND (storage.foldername(name))[2] IN (
      SELECT id FROM inkflow_studios
      WHERE lower(trim(email)) = lower(trim(COALESCE(auth.jwt()->>'email', '')))
    )
  );

CREATE POLICY "client_dossier_delete_own_studio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'client-dossier'
    AND (storage.foldername(name))[2] IN (
      SELECT id FROM inkflow_studios
      WHERE lower(trim(email)) = lower(trim(COALESCE(auth.jwt()->>'email', '')))
    )
  );

CREATE POLICY "client_dossier_select_own_studio"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'client-dossier'
    AND (storage.foldername(name))[2] IN (
      SELECT id FROM inkflow_studios
      WHERE lower(trim(email)) = lower(trim(COALESCE(auth.jwt()->>'email', '')))
    )
  );
