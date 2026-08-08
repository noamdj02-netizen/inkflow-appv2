-- Captures d'écran signalements produit (tatoueurs authentifiés)
DROP POLICY IF EXISTS "Authenticated upload product feedback screenshots" ON storage.objects;

CREATE POLICY "Authenticated upload product feedback screenshots"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'feedback-reports'
    AND (storage.foldername(name))[2] = (auth.uid())::text
    AND storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp')
  );
