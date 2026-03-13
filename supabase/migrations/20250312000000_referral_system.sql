-- ============================================================
-- InkFlow - Système de parrainage (Referral System)
-- Étape 1 : Architecture Base de Données
-- Exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Colonnes referral_code et referred_by sur inkflow_studios
-- (inkflow_studios.id = auth.users.id, un studio = un utilisateur)
ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS referred_by TEXT REFERENCES inkflow_studios(id) ON DELETE SET NULL;

-- Index pour les lookups par code
CREATE UNIQUE INDEX IF NOT EXISTS idx_studios_referral_code
  ON inkflow_studios(referral_code)
  WHERE referral_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_studios_referred_by
  ON inkflow_studios(referred_by)
  WHERE referred_by IS NOT NULL;

-- 2. Table referrals pour l'historique des parrainages
CREATE TABLE IF NOT EXISTS inkflow_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  referee_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT inkflow_referrals_unique_pair UNIQUE (referrer_id, referee_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON inkflow_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON inkflow_referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON inkflow_referrals(status);

COMMENT ON TABLE inkflow_referrals IS 'Historique des parrainages : referrer = parrain, referee = filleul';

-- 3. Fonction pour générer un code de parrainage unique (6 caractères alphanumériques majuscules)
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- sans I,O,0,1 pour éviter confusion
  result TEXT := '';
  i INT;
  max_attempts INT := 50;
  attempt INT := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    -- Vérifier unicité
    IF NOT EXISTS (SELECT 1 FROM inkflow_studios WHERE referral_code = result) THEN
      RETURN result;
    END IF;
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Impossible de générer un code de parrainage unique après % tentatives', max_attempts;
    END IF;
  END LOOP;
END;
$$;

-- 4. Trigger : générer referral_code à la création d'un nouveau studio
CREATE OR REPLACE FUNCTION set_referral_code_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_referral_code ON inkflow_studios;
CREATE TRIGGER trigger_set_referral_code
  BEFORE INSERT ON inkflow_studios
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code_on_insert();

-- 5. Backfill : générer des codes pour les studios existants qui n'en ont pas
UPDATE inkflow_studios
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL OR referral_code = '';
