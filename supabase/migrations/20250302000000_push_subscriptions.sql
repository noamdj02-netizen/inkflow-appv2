-- Web Push : abonnements par studio (plusieurs appareils possibles)
CREATE TABLE IF NOT EXISTS inkflow_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_studio ON inkflow_push_subscriptions(studio_id);

-- RLS : le studio ne peut gérer que ses propres abonnements
ALTER TABLE inkflow_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_owner" ON inkflow_push_subscriptions
  FOR ALL
  USING (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  )
  WITH CHECK (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );
