-- Activer le cron send-appointment-reminders (J-2, J-1, H-2)
-- Fonction déployée mais cron non schedulé en prod.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Idempotent : supprimer si déjà existant
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-appointment-reminders') THEN
    PERFORM cron.unschedule('send-appointment-reminders');
  END IF;
END $$;

-- Toutes les 15 min (rappels J-2, J-1, H-2 pour les RDVs à venir)
SELECT cron.schedule(
  'send-appointment-reminders',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://jnrprkdueseahfrguhvt.supabase.co/functions/v1/send-appointment-reminders',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
