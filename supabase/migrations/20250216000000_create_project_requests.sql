-- Demandes de projet (Booking Flow)
-- Exécuter dans Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS inkflow_project_requests (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_instagram TEXT,
  description TEXT NOT NULL,
  placement TEXT,
  size TEXT,
  budget TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  reference_images JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_requests_studio ON inkflow_project_requests(studio_id);
CREATE INDEX IF NOT EXISTS idx_project_requests_status ON inkflow_project_requests(status);

-- Activer Realtime pour mises à jour instantanées du dashboard (idempotent)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE inkflow_project_requests;
EXCEPTION WHEN duplicate_object THEN
  NULL; /* déjà dans la publication */
END $$;
