-- ============================================================
-- InkFlow - Storage RLS : restreindre avatars au studio du JWT
-- Seul le propriétaire du studio peut uploader/modifier/supprimer
-- son fichier avatars/<studio_id>.*
-- ============================================================

-- Drop existing avatar policies (by name from 20250219000000)
DROP POLICY IF EXISTS "Users can upload their avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their avatar" ON storage.objects;
-- Keep "Avatar images are public" for SELECT so profile pics can be displayed

-- Own studio_id for current JWT (same pattern as tables)
-- Path format: avatars/<studio_id>.jpg (filename without extension = studio_id)
CREATE POLICY "avatar_insert_own_studio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'avatars'
    AND split_part((storage.foldername(name))[2]::text, '.', 1) IN (
      SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "avatar_update_own_studio"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'avatars'
    AND split_part((storage.foldername(name))[2]::text, '.', 1) IN (
      SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "avatar_delete_own_studio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'avatars'
    AND split_part((storage.foldername(name))[2]::text, '.', 1) IN (
      SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );
