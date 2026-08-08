-- InkFlow : plan Studio gratuit pour noamdj02@gmail.com — fin de période d’essai, statut actif.
-- Aligné sur 20260322120000_grant_studio_3y_17c4bb37.sql
-- Appliquer : Supabase Dashboard → SQL Editor, ou `supabase db push` (projet lié).

UPDATE inkflow_studios
SET
  subscription_status = 'active',
  plan_type = 'studio',
  trial_ends_at = NULL,
  csv_import_slots_remaining = NULL,
  updated_at = NOW()
WHERE lower(trim(email)) = 'noamdj02@gmail.com';

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
  'promo_studio_free_' || s.id,
  s.id,
  'studio',
  'active',
  NOW(),
  NOW() + INTERVAL '10 years',
  NOW(),
  NOW()
FROM inkflow_studios s
WHERE lower(trim(s.email)) = 'noamdj02@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM inkflow_subscriptions sub
    WHERE sub.studio_id = s.id
  )
ON CONFLICT (id) DO UPDATE SET
  plan = 'studio',
  status = 'active',
  current_period_end = GREATEST(inkflow_subscriptions.current_period_end, NOW() + INTERVAL '10 years'),
  updated_at = NOW();

UPDATE inkflow_subscriptions
SET
  plan = 'studio',
  status = 'active',
  current_period_end = GREATEST(current_period_end, NOW() + INTERVAL '10 years'),
  updated_at = NOW()
WHERE studio_id IN (
  SELECT id FROM inkflow_studios WHERE lower(trim(email)) = 'noamdj02@gmail.com'
);
