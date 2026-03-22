-- InkFlow: Plan Studio gratuit 3 ans pour le studio 17c4bb37-4ed6-4cee-8371-1036c055290b
-- Aligné sur la logique promo (noamdj02 / safeplacerouen) : plan_type studio, essai levé, CSV illimité.
-- Période d’abonnement : au moins 3 ans à partir de l’application de la migration.
-- À appliquer : Supabase Dashboard > SQL Editor, ou `supabase db push`.

UPDATE inkflow_studios
SET
  subscription_status = 'active',
  plan_type = 'studio',
  trial_ends_at = NULL,
  csv_import_slots_remaining = NULL,
  updated_at = NOW()
WHERE id = '17c4bb37-4ed6-4cee-8371-1036c055290b';

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
  'promo_studio_3y_' || s.id,
  s.id,
  'studio',
  'active',
  NOW(),
  NOW() + INTERVAL '3 years',
  NOW(),
  NOW()
FROM inkflow_studios s
WHERE s.id = '17c4bb37-4ed6-4cee-8371-1036c055290b'
  AND NOT EXISTS (
    SELECT 1 FROM inkflow_subscriptions sub
    WHERE sub.studio_id = s.id
  )
ON CONFLICT (id) DO UPDATE SET
  plan = 'studio',
  status = 'active',
  current_period_end = GREATEST(inkflow_subscriptions.current_period_end, NOW() + INTERVAL '3 years'),
  updated_at = NOW();

UPDATE inkflow_subscriptions
SET
  plan = 'studio',
  status = 'active',
  current_period_end = GREATEST(current_period_end, NOW() + INTERVAL '3 years'),
  updated_at = NOW()
WHERE studio_id = '17c4bb37-4ed6-4cee-8371-1036c055290b';
