-- InkFlow: Plan Studio gratuit à vie pour safeplacerouen@gmail.com
-- Complète / remplace l’effet de 20250227210000 (trialing 1 an sans inkflow_studios.plan_type).
-- À appliquer: Supabase Dashboard > SQL Editor, ou `supabase db push` (local/CI).

-- 1. Confirmer l’email si besoin (login)
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = 'safeplacerouen@gmail.com';

-- 2. Studio: actif, plan Studio, essai sans échéance (NULL), CSV illimité (NULL)
UPDATE inkflow_studios
SET
  subscription_status = 'active',
  plan_type = 'studio',
  trial_ends_at = NULL,
  csv_import_slots_remaining = NULL,
  updated_at = NOW()
WHERE email = 'safeplacerouen@gmail.com';

-- 3. Ligne inkflow_subscriptions (promo interne, pas de Stripe)
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
  'active',
  NOW(),
  NOW() + INTERVAL '100 years',
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
  status = 'active',
  current_period_end = GREATEST(inkflow_subscriptions.current_period_end, NOW() + INTERVAL '100 years'),
  updated_at = NOW();

-- 4. Mettre à jour toute souscription existante pour ce studio (ex. id Stripe)
UPDATE inkflow_subscriptions sub
SET
  plan = 'studio',
  status = 'active',
  current_period_end = GREATEST(sub.current_period_end, NOW() + INTERVAL '100 years'),
  updated_at = NOW()
FROM inkflow_studios s
WHERE sub.studio_id = s.id
  AND s.email = 'safeplacerouen@gmail.com'
  AND (sub.plan != 'studio' OR sub.status != 'active');
