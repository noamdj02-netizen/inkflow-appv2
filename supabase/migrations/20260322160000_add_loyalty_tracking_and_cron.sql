-- Colonnes de tracking fidélité sur inkflow_appointments
ALTER TABLE inkflow_appointments
  ADD COLUMN IF NOT EXISTS loyalty_j1_sent_at  TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS loyalty_j7_sent_at  TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS loyalty_j30_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Index pour les requêtes cron (date + statut + colonnes loyalty)
CREATE INDEX IF NOT EXISTS idx_appointments_loyalty
  ON inkflow_appointments (date, status, client_email)
  WHERE client_email IS NOT NULL AND status IN ('confirmed', 'completed');

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Cron quotidien à 10h UTC — send-loyalty-emails
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-loyalty-emails') THEN
    PERFORM cron.unschedule('send-loyalty-emails');
  END IF;
END $$;

SELECT cron.schedule(
  'send-loyalty-emails',
  '0 10 * * *',
  $$
    SELECT net.http_post(
      url := 'https://jnrprkdueseahfrguhvt.supabase.co/functions/v1/send-loyalty-emails',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
