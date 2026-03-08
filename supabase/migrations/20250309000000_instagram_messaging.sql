-- Connexions Instagram des studios (via Meta Graph API)
CREATE TABLE IF NOT EXISTS instagram_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  ig_account_id TEXT NOT NULL,
  page_access_token TEXT NOT NULL,
  username TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(studio_id)
);

-- Messages Instagram (reçus et envoyés)
CREATE TABLE IF NOT EXISTS instagram_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  ig_account_id TEXT NOT NULL,
  from_id TEXT,
  to_id TEXT,
  message_id TEXT,
  text TEXT,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instagram_messages_studio ON instagram_messages(studio_id);
CREATE INDEX IF NOT EXISTS idx_instagram_messages_from_to ON instagram_messages(ig_account_id, from_id, to_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_instagram_messages_mid ON instagram_messages(message_id) WHERE message_id IS NOT NULL;

ALTER TABLE instagram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_messages ENABLE ROW LEVEL SECURITY;

-- RLS : accès via studio (même pattern que inkflow_*)
CREATE POLICY "instagram_connections_owner" ON instagram_connections
  FOR ALL USING (
    studio_id IN (
      SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "instagram_messages_owner" ON instagram_messages
  FOR ALL USING (
    studio_id IN (
      SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );
