-- InkFlow: Attribuer le plan Studio gratuitement à noamdj02@gmail.com
-- À exécuter dans Supabase Dashboard > SQL Editor
--
-- Si le studio n'existe pas encore : l'utilisateur doit d'abord s'inscrire sur /signup.
-- Une fois inscrit, réexécuter ce script pour lui attribuer le plan Studio.

-- 1. Mettre à jour inkflow_studios : subscription_status = active, trial prolongé
UPDATE inkflow_studios
SET
  subscription_status = 'active',
  trial_ends_at = NOW() + INTERVAL '1 year',
  updated_at = NOW()
WHERE email = 'noamdj02@gmail.com';

-- 2. Créer ou mettre à jour inkflow_subscriptions avec le plan Studio
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
  'promo_noamdj02_' || s.id,
  s.id,
  'studio',
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  NOW(),
  NOW()
FROM inkflow_studios s
WHERE s.email = 'noamdj02@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM inkflow_subscriptions sub
    WHERE sub.studio_id = s.id
  )
ON CONFLICT (id) DO UPDATE SET
  plan = 'studio',
  status = 'active',
  current_period_end = GREATEST(inkflow_subscriptions.current_period_end, NOW() + INTERVAL '1 year'),
  updated_at = NOW();

-- 3. Si le studio a déjà une subscription, la mettre à jour vers Studio
UPDATE inkflow_subscriptions sub
SET
  plan = 'studio',
  status = 'active',
  current_period_end = GREATEST(sub.current_period_end, NOW() + INTERVAL '1 year'),
  updated_at = NOW()
FROM inkflow_studios s
WHERE sub.studio_id = s.id
  AND s.email = 'noamdj02@gmail.com'
  AND (sub.plan != 'studio' OR sub.status != 'active');
