-- Add avatar_url column to inkflow_studios
ALTER TABLE inkflow_studios ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for InkFlow assets (avatars, uploads, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inkflow-assets',
  'inkflow-assets',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow authenticated users to upload their avatar
CREATE POLICY "Users can upload their avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'inkflow-assets' AND (storage.foldername(name))[1] = 'avatars');

CREATE POLICY "Users can update their avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'inkflow-assets' AND (storage.foldername(name))[1] = 'avatars');

CREATE POLICY "Users can delete their avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'inkflow-assets' AND (storage.foldername(name))[1] = 'avatars');

CREATE POLICY "Avatar images are public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'inkflow-assets');
