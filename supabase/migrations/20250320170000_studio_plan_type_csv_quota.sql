-- Plan affiché côté studio + quota restant import CSV (synchronisé par webhook Stripe)
ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'solo'
    CHECK (plan_type IN ('solo', 'pro', 'studio', 'enterprise'));

ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS csv_import_slots_remaining INTEGER NULL;

COMMENT ON COLUMN inkflow_studios.plan_type IS 'Plan commercial (solo|pro|studio|enterprise), aligné sur Stripe / inkflow_subscriptions.plan';
COMMENT ON COLUMN inkflow_studios.csv_import_slots_remaining IS 'Places CRM restantes pour import CSV après sync webhook ; NULL = illimité (plan studio/enterprise). Le quota est au niveau studio (pas de colonne csvImportRemainingSlots sur inkflow_clients) : il est recalculé depuis COUNT(inkflow_clients) + plan.';

-- Un seul enregistrement par abonnement Stripe (upsert webhook)
CREATE UNIQUE INDEX IF NOT EXISTS idx_inkflow_subscriptions_stripe_subscription_id
  ON inkflow_subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- RPC : inclure plan_type et csv_import_slots_remaining
-- Impossible de changer le RETURNS TABLE avec CREATE OR REPLACE seul (42P13) : DROP puis CREATE.
DROP FUNCTION IF EXISTS public.get_studio_by_email_with_data(text);

CREATE FUNCTION get_studio_by_email_with_data(p_email TEXT)
RETURNS TABLE (
  id TEXT,
  slug TEXT,
  subscription_status TEXT,
  trial_ends_at TIMESTAMPTZ,
  siret TEXT,
  plan_type TEXT,
  csv_import_slots_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.slug::TEXT,
    s.subscription_status::TEXT,
    s.trial_ends_at,
    s.siret::TEXT,
    s.plan_type::TEXT,
    s.csv_import_slots_remaining
  FROM inkflow_studios s
  LEFT JOIN (
    SELECT studio_id, COUNT(*) AS cnt FROM inkflow_clients GROUP BY studio_id
  ) cl ON cl.studio_id = s.id
  LEFT JOIN (
    SELECT studio_id, COUNT(*) AS cnt FROM inkflow_appointments GROUP BY studio_id
  ) ap ON ap.studio_id = s.id
  WHERE s.email = p_email
  ORDER BY COALESCE(cl.cnt, 0) + COALESCE(ap.cnt, 0) DESC, s.updated_at DESC NULLS LAST
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_studio_by_email_with_data(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_studio_by_email_with_data(text) TO authenticated;
