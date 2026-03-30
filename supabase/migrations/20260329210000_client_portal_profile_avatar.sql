-- Avatar portail client : URL persistée en base (OAuth ne peut pas écraser user_metadata de façon fiable).
-- Storage reste sur inkflow-assets/client-avatars/<auth.uid()>.jpg (policies existantes).

CREATE TABLE IF NOT EXISTS inkflow_client_portal_profiles (
  user_id UUID PRIMARY KEY,
  portal_avatar_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE inkflow_client_portal_profiles IS
  'Profil minimal espace client : photo uploadée (URL publique storage), prioritaire sur Google picture.';

ALTER TABLE inkflow_client_portal_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_portal_profile_select_own" ON inkflow_client_portal_profiles;
CREATE POLICY "client_portal_profile_select_own"
  ON inkflow_client_portal_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "client_portal_profile_insert_own" ON inkflow_client_portal_profiles;
CREATE POLICY "client_portal_profile_insert_own"
  ON inkflow_client_portal_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "client_portal_profile_update_own" ON inkflow_client_portal_profiles;
CREATE POLICY "client_portal_profile_update_own"
  ON inkflow_client_portal_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "client_portal_profile_delete_own" ON inkflow_client_portal_profiles;
CREATE POLICY "client_portal_profile_delete_own"
  ON inkflow_client_portal_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON inkflow_client_portal_profiles TO authenticated;

-- Marge pour JPEG redimensionné côté client (bucket historique à 5 Mo)
UPDATE storage.buckets
SET file_size_limit = 10485760
WHERE id = 'inkflow-assets' AND (file_size_limit IS NULL OR file_size_limit < 10485760);
