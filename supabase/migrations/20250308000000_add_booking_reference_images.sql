-- Add reference_images to inkflow_bookings (URLs des images uploadées)
ALTER TABLE inkflow_bookings ADD COLUMN IF NOT EXISTS reference_images JSONB DEFAULT '[]';

-- Storage: allow anon insert for booking reference images (vitrine publique)
CREATE POLICY "Public can upload booking reference images"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'booking-refs'
    AND storage.extension(name) IN ('jpg','jpeg','png','webp')
  );
