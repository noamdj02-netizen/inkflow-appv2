-- Cron : rappel push « créneau dépassé » (Edge remind-slot-closeout-nudge)
-- Adapter l’URL si le project_ref change (comme remind-balance-day-of).

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'remind-slot-closeout-nudge') THEN
    PERFORM cron.unschedule('remind-slot-closeout-nudge');
  END IF;
END $$;

-- Toutes les 15 minutes (fuseau serveur pg_cron = UTC côté Supabase).
SELECT cron.schedule(
  'remind-slot-closeout-nudge',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jnrprkdueseahfrguhvt.supabase.co/functions/v1/remind-slot-closeout-nudge',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
