-- Snapshots journaliers (cron Vercel) pour la page /admin/daily-brief. Écriture : service role uniquement. Lecture : service role (API) ou fondateur via JWT côté app (policy ci-dessous).
CREATE TABLE IF NOT EXISTS public.daily_briefs (
  date DATE PRIMARY KEY,
  revenue NUMERIC NOT NULL DEFAULT 0,
  bookings INTEGER NOT NULL DEFAULT 0,
  new_studios INTEGER NOT NULL DEFAULT 0,
  unpaid_deposits INTEGER NOT NULL DEFAULT 0,
  pending_projects INTEGER NOT NULL DEFAULT 0,
  ig_reach INTEGER,
  ig_profile_views INTEGER,
  alerts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS daily_briefs_date_desc ON public.daily_briefs (date DESC);

ALTER TABLE public.daily_briefs ENABLE ROW LEVEL SECURITY;

-- Aucun accès direct client : la page consomme GET /api/daily-brief (service role).
-- Optionnel : lecture pour JWT fondateur (même logique e-mails @ink-flow.me / @inkflow.me).
CREATE POLICY "daily_briefs_deny_all"
  ON public.daily_briefs
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.daily_briefs IS 'Résumé quotidien (cron) — compteurs agrégés, pas de PII client.';
