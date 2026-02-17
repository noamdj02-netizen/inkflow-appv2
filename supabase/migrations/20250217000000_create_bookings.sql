-- ============================================================
-- InkFlow - Table Bookings (prise de RDV depuis la vitrine)
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- RLS : INSERT public (tout le monde peut créer une demande),
--       SELECT/UPDATE réservés au propriétaire du studio (tatoueur).
-- ============================================================

CREATE TABLE IF NOT EXISTS inkflow_bookings (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  description TEXT NOT NULL,
  requested_date DATE NOT NULL,
  requested_time TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_studio ON inkflow_bookings(studio_id);
CREATE INDEX IF NOT EXISTS idx_bookings_requested_date ON inkflow_bookings(requested_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON inkflow_bookings(status);

-- RLS
ALTER TABLE inkflow_bookings ENABLE ROW LEVEL SECURITY;

-- INSERT : public (tout le monde peut créer une demande depuis la vitrine)
DROP POLICY IF EXISTS "bookings_public_insert" ON inkflow_bookings;
CREATE POLICY "bookings_public_insert" ON inkflow_bookings
  FOR INSERT WITH CHECK (true);

-- SELECT / UPDATE : seul le propriétaire du studio (tatoueur) peut voir et modifier ses demandes
DROP POLICY IF EXISTS "bookings_owner" ON inkflow_bookings;
CREATE POLICY "bookings_owner" ON inkflow_bookings
  FOR ALL USING (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
    )
  );

-- Realtime : le dashboard reçoit les nouvelles demandes instantanément
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE inkflow_bookings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
