-- Favoris studios (cœur Explore) : synchronisés sur le compte client (email), comme les favoris flash.

CREATE TABLE IF NOT EXISTS inkflow_client_studio_favorites (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_email  TEXT NOT NULL,
  studio_id     TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (client_email, studio_id)
);

CREATE INDEX IF NOT EXISTS idx_studio_favs_client ON inkflow_client_studio_favorites(client_email);
CREATE INDEX IF NOT EXISTS idx_studio_favs_studio ON inkflow_client_studio_favorites(studio_id);

ALTER TABLE inkflow_client_studio_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "studio_favs_client_read" ON inkflow_client_studio_favorites;
CREATE POLICY "studio_favs_client_read" ON inkflow_client_studio_favorites
  FOR SELECT USING (client_email = auth.email());

DROP POLICY IF EXISTS "studio_favs_client_insert" ON inkflow_client_studio_favorites;
CREATE POLICY "studio_favs_client_insert" ON inkflow_client_studio_favorites
  FOR INSERT WITH CHECK (client_email = auth.email());

DROP POLICY IF EXISTS "studio_favs_client_delete" ON inkflow_client_studio_favorites;
CREATE POLICY "studio_favs_client_delete" ON inkflow_client_studio_favorites
  FOR DELETE USING (client_email = auth.email());

DROP POLICY IF EXISTS "studio_favs_svc" ON inkflow_client_studio_favorites;
CREATE POLICY "studio_favs_svc" ON inkflow_client_studio_favorites
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

GRANT SELECT, INSERT, DELETE ON inkflow_client_studio_favorites TO authenticated;

COMMENT ON TABLE inkflow_client_studio_favorites IS
  'Studios marqués en favori dans l''app client (Explore) ; aligné sur client_email comme inkflow_client_favorites.';
