-- InkFlow : plan Studio gratuit 5 mois pour ink.stories.pro@gmail.com
-- À appliquer avec `supabase db push` ou dans le SQL Editor (projet prod).
--
-- Si aucune ligne n’est mise à jour : l’utilisateur doit d’abord créer un compte / studio sur /signup,
-- puis réexécuter ce script.

-- 1. Studio : actif, plan commercial studio, fin d’essai / fenêtre alignée sur +5 mois
UPDATE inkflow_studios
SET
  subscription_status = 'active',
  plan_type = 'studio',
  trial_ends_at = GREATEST(COALESCE(trial_ends_at, NOW()), NOW() + INTERVAL '5 months'),
  updated_at = NOW()
WHERE email = 'ink.stories.pro@gmail.com';

-- 2. Abonnement promo (création si absent)
INSERT INTO inkflow_subscriptions (
  id,
  studio_id,
  plan,
  status,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
)
SELECT
  'promo_inkstoriespro_' || s.id,
  s.id,
  'studio',
  'active',
  NOW(),
  NOW() + INTERVAL '5 months',
  NOW(),
  NOW()
FROM inkflow_studios s
WHERE s.email = 'ink.stories.pro@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM inkflow_subscriptions sub
    WHERE sub.studio_id = s.id
  )
ON CONFLICT (id) DO UPDATE SET
  plan = 'studio',
  status = 'active',
  current_period_end = GREATEST(
    COALESCE(inkflow_subscriptions.current_period_end, NOW()),
    NOW() + INTERVAL '5 months'
  ),
  updated_at = NOW();

-- 3. Subscription existante (autre id) : aligner plan Studio + prolonger d’au moins 5 mois
UPDATE inkflow_subscriptions sub
SET
  plan = 'studio',
  status = 'active',
  current_period_end = GREATEST(COALESCE(sub.current_period_end, NOW()), NOW() + INTERVAL '5 months'),
  updated_at = NOW()
FROM inkflow_studios s
WHERE sub.studio_id = s.id
  AND s.email = 'ink.stories.pro@gmail.com';
