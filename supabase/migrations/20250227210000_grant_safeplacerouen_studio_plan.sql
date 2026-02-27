-- InkFlow: Activer le login et attribuer le plan Studio (meilleure offre) à safeplacerouen@gmail.com
-- À exécuter dans Supabase Dashboard > SQL Editor
-- Nécessite les droits sur auth.users (rôle postgres ou service_role)
--
-- Si le studio n'existe pas encore : l'utilisateur doit d'abord s'inscrire sur /signup.
-- Une fois inscrit, réexécuter ce script pour lui attribuer le plan Studio.

-- 1. Confirmer l'email pour permettre le login (si confirmation email activée)
-- Note: confirmed_at est une colonne générée, on ne la modifie pas
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = 'safeplacerouen@gmail.com';

-- 2. Attribuer le plan Studio (meilleure offre) à tous les studios de cet email
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
  'promo_safeplacerouen_' || s.id,
  s.id,
  'studio',
  'trialing',
  NOW(),
  NOW() + INTERVAL '1 year',
  NOW(),
  NOW()
FROM inkflow_studios s
WHERE s.email = 'safeplacerouen@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM inkflow_subscriptions sub
    WHERE sub.studio_id = s.id
  )
ON CONFLICT (id) DO UPDATE SET
  plan = 'studio',
  status = 'trialing',
  current_period_end = GREATEST(inkflow_subscriptions.current_period_end, NOW() + INTERVAL '1 year'),
  updated_at = NOW();

-- Si le studio a déjà une subscription, la mettre à jour vers Studio
UPDATE inkflow_subscriptions sub
SET
  plan = 'studio',
  status = CASE WHEN sub.status = 'active' THEN 'active' ELSE 'trialing' END,
  current_period_end = GREATEST(sub.current_period_end, NOW() + INTERVAL '1 year'),
  updated_at = NOW()
FROM inkflow_studios s
WHERE sub.studio_id = s.id
  AND s.email = 'safeplacerouen@gmail.com'
  AND sub.plan != 'studio';
