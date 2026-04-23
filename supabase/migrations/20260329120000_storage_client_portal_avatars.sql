-- Avatars portail client : inkflow-assets/client-avatars/<auth.uid()>.jpg
-- Les tatoueurs utilisent avatars/<studio_id>.jpg (RLS studio) ; les clients ont un chemin dédié.
-- Idempotent : replis si déjà appliqué manuellement sur la prod.

DROP POLICY IF EXISTS "client_avatar_insert_own_uid" ON storage.objects;
CREATE POLICY "client_avatar_insert_own_uid"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'client-avatars'
    AND split_part((storage.foldername(name))[2]::text, '.', 1) = auth.uid()::text
    AND storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp')
  );

DROP POLICY IF EXISTS "client_avatar_update_own_uid" ON storage.objects;
CREATE POLICY "client_avatar_update_own_uid"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'client-avatars'
    AND split_part((storage.foldername(name))[2]::text, '.', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS "client_avatar_delete_own_uid" ON storage.objects;
CREATE POLICY "client_avatar_delete_own_uid"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'client-avatars'
    AND split_part((storage.foldername(name))[2]::text, '.', 1) = auth.uid()::text
  );
