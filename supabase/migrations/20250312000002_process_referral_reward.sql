-- ============================================================
-- InkFlow - Fonction RPC process_referral_reward
-- Étape 4 : Logique de récompense parrainage
-- Appelée quand le filleul s'abonne (ex: depuis Stripe webhook)
-- ============================================================

CREATE OR REPLACE FUNCTION process_referral_reward(p_referee_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id TEXT;
  v_referral_id UUID;
  v_now TIMESTAMPTZ := NOW();
  v_one_month INTERVAL := INTERVAL '1 month';
BEGIN
  -- 1. Vérifier que le filleul a un parrain
  SELECT referred_by INTO v_referrer_id
  FROM inkflow_studios
  WHERE id = p_referee_id AND referred_by IS NOT NULL;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_referrer');
  END IF;

  -- 2. Récupérer le referral en statut pending
  SELECT id INTO v_referral_id
  FROM inkflow_referrals
  WHERE referrer_id = v_referrer_id AND referee_id = p_referee_id AND status = 'pending'
  LIMIT 1;

  IF v_referral_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_completed_or_not_found');
  END IF;

  -- 3. Passer le parrainage à completed
  UPDATE inkflow_referrals
  SET status = 'completed', completed_at = v_now
  WHERE id = v_referral_id;

  -- 4. +1 mois pour le filleul (referee)
  -- trial_ends_at sur inkflow_studios
  UPDATE inkflow_studios
  SET trial_ends_at = COALESCE(trial_ends_at, v_now) + v_one_month,
      updated_at = v_now
  WHERE id = p_referee_id;

  -- current_period_end sur inkflow_subscriptions si existe
  UPDATE inkflow_subscriptions
  SET current_period_end = COALESCE(current_period_end, v_now) + v_one_month,
      updated_at = v_now
  WHERE studio_id = p_referee_id;

  -- 5. +1 mois pour le parrain (referrer)
  UPDATE inkflow_studios
  SET trial_ends_at = COALESCE(trial_ends_at, v_now) + v_one_month,
      updated_at = v_now
  WHERE id = v_referrer_id;

  UPDATE inkflow_subscriptions
  SET current_period_end = COALESCE(current_period_end, v_now) + v_one_month,
      updated_at = v_now
  WHERE studio_id = v_referrer_id;

  RETURN jsonb_build_object(
    'success', true,
    'referrer_id', v_referrer_id,
    'referee_id', p_referee_id,
    'referral_id', v_referral_id
  );
END;
$$;

COMMENT ON FUNCTION process_referral_reward(TEXT) IS
  'Applique la récompense parrainage : completed + 1 mois gratuit pour parrain et filleul. Appeler quand le filleul s''abonne.';
