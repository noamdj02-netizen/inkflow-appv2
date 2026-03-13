-- RLS pour inkflow_referrals
-- Lecture : le parrain peut lire ses propres referrals
-- Insert : le filleul peut créer un referral où il est le referee (lors de l'inscription)

ALTER TABLE inkflow_referrals ENABLE ROW LEVEL SECURITY;

-- Lecture : parrain voit ses referrals
CREATE POLICY "referrals_select_referrer"
  ON inkflow_referrals FOR SELECT
  USING (
    referrer_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = (auth.jwt()->>'email')
    )
  );

-- Insert : filleul peut créer un referral où il est le referee (inscription avec code)
CREATE POLICY "referrals_insert_referee"
  ON inkflow_referrals FOR INSERT
  WITH CHECK (
    referee_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = (auth.jwt()->>'email')
    )
  );
