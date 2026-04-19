-- Web Push Option B : table `subscription` jsonb + index unique sur endpoint.
-- Cas A : table absente (migration 20250302 jamais appliquée) → création complète.
-- Cas B : table legacy (endpoint, keys_p256dh, keys_auth) → migration vers jsonb.

-- ── A) Table inexistante : création directe au format Option B
CREATE TABLE IF NOT EXISTS public.inkflow_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id text NOT NULL REFERENCES public.inkflow_studios(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ── B) Table legacy : migrer vers jsonb puis supprimer les anciennes colonnes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inkflow_push_subscriptions'
      AND column_name = 'endpoint'
  ) THEN
    ALTER TABLE public.inkflow_push_subscriptions
      ADD COLUMN IF NOT EXISTS subscription jsonb;

    UPDATE public.inkflow_push_subscriptions
    SET subscription = jsonb_build_object(
      'endpoint', endpoint,
      'expirationTime', null,
      'keys', jsonb_build_object('p256dh', keys_p256dh, 'auth', keys_auth)
    )
    WHERE subscription IS NULL
      AND endpoint IS NOT NULL
      AND keys_p256dh IS NOT NULL
      AND keys_auth IS NOT NULL;

    DELETE FROM public.inkflow_push_subscriptions WHERE subscription IS NULL;

    ALTER TABLE public.inkflow_push_subscriptions
      ALTER COLUMN subscription SET NOT NULL;

    ALTER TABLE public.inkflow_push_subscriptions DROP CONSTRAINT IF EXISTS inkflow_push_subscriptions_endpoint_key;

    ALTER TABLE public.inkflow_push_subscriptions
      DROP COLUMN IF EXISTS endpoint,
      DROP COLUMN IF EXISTS keys_p256dh,
      DROP COLUMN IF EXISTS keys_auth;
  END IF;
END $$;

-- Index studio (si la table venait du schéma legacy, l’ancien index peut encore exister)
DROP INDEX IF EXISTS public.idx_push_subscriptions_studio;

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint_global
  ON public.inkflow_push_subscriptions ((subscription->>'endpoint'));

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_studio_id
  ON public.inkflow_push_subscriptions (studio_id);

COMMENT ON COLUMN public.inkflow_push_subscriptions.subscription IS 'PushSubscription JSON (endpoint, keys.p256dh, keys.auth) — Web Push VAPID';

-- RLS (idempotent)
ALTER TABLE public.inkflow_push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_owner" ON public.inkflow_push_subscriptions;

CREATE POLICY "push_subscriptions_owner" ON public.inkflow_push_subscriptions
  FOR ALL
  USING (
    studio_id IN (
      SELECT id FROM public.inkflow_studios
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  )
  WITH CHECK (
    studio_id IN (
      SELECT id FROM public.inkflow_studios
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );
