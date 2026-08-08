-- Migration: votes d'utilité sur les avis
CREATE TABLE IF NOT EXISTS inkflow_review_votes (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  review_id         TEXT NOT NULL REFERENCES inkflow_reviews(id) ON DELETE CASCADE,
  voter_fingerprint TEXT NOT NULL,
  vote              TEXT NOT NULL CHECK (vote IN ('helpful', 'not_helpful')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, voter_fingerprint)
);

ALTER TABLE inkflow_review_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "votes_public_insert" ON inkflow_review_votes;
CREATE POLICY "votes_public_insert" ON inkflow_review_votes
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "votes_public_read" ON inkflow_review_votes;
CREATE POLICY "votes_public_read" ON inkflow_review_votes
  FOR SELECT USING (TRUE);
