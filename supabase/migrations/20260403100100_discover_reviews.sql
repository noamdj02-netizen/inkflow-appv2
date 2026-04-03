-- Migration: table inkflow_reviews
CREATE TABLE IF NOT EXISTS inkflow_reviews (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  studio_id           TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  client_name         TEXT NOT NULL,
  client_email        TEXT NOT NULL,
  client_email_hash   TEXT NOT NULL,
  rating              INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body                TEXT CHECK (char_length(body) <= 1000),
  tattoo_style        TEXT,
  tattoo_photo_url    TEXT,
  appointment_id      TEXT REFERENCES inkflow_appointments(id) ON DELETE SET NULL,
  is_verified         BOOLEAN DEFAULT FALSE,
  status              TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  moderated_at        TIMESTAMPTZ,
  moderation_reason   TEXT,
  reply_body          TEXT,
  reply_at            TIMESTAMPTZ,
  helpful_count       INTEGER DEFAULT 0,
  not_helpful_count   INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_email_studio
  ON inkflow_reviews(client_email_hash, studio_id);

CREATE INDEX IF NOT EXISTS idx_reviews_studio_approved
  ON inkflow_reviews(studio_id, created_at DESC)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_reviews_appointment
  ON inkflow_reviews(appointment_id)
  WHERE appointment_id IS NOT NULL;

ALTER TABLE inkflow_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_public_read" ON inkflow_reviews;
CREATE POLICY "reviews_public_read" ON inkflow_reviews
  FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "reviews_public_insert" ON inkflow_reviews;
CREATE POLICY "reviews_public_insert" ON inkflow_reviews
  FOR INSERT WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "reviews_owner_manage" ON inkflow_reviews;
CREATE POLICY "reviews_owner_manage" ON inkflow_reviews
  FOR ALL USING (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
    )
  );

-- Trigger rating
CREATE OR REPLACE FUNCTION update_studio_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE inkflow_studios
  SET
    rating_avg = (
      SELECT COALESCE(AVG(rating)::NUMERIC(3,2), 0)
      FROM inkflow_reviews
      WHERE studio_id = NEW.studio_id AND status = 'approved'
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM inkflow_reviews
      WHERE studio_id = NEW.studio_id AND status = 'approved'
    ),
    discover_rank = (
      SELECT (
        COALESCE(AVG(rating), 0) *
        LN(COUNT(*) + 1) *
        (1.0 / (1.0 + EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 2592000))
      )::INTEGER
      FROM inkflow_reviews
      WHERE studio_id = NEW.studio_id AND status = 'approved'
    ),
    updated_at = NOW()
  WHERE id = NEW.studio_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_studio_rating ON inkflow_reviews;
CREATE TRIGGER trg_update_studio_rating
  AFTER INSERT OR UPDATE ON inkflow_reviews
  FOR EACH ROW EXECUTE FUNCTION update_studio_rating();
