-- Les refs vitrine (booking-refs) étaient INSERT autorisé pour TO anon uniquement.
-- Un visiteur avec session Supabase (portail client / compte) a le rôle authenticated → upload refusé.
-- Même règle que la policy anon : dossier booking-refs + extensions image courantes.

CREATE POLICY "Authenticated can upload booking reference images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'booking-refs'
    AND storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp')
  );
