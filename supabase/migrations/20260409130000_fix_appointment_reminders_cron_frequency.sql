-- Correction : send-appointment-reminders passait toutes les 15 min (*/15 * * * *)
-- Les rappels J-2, J-1, H-2 n'ont pas besoin de cette précision → 1x/heure suffit.
-- Réduction : ~2 880 invocations/mois → ~720 invocations/mois

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-appointment-reminders') THEN
    PERFORM cron.unschedule('send-appointment-reminders');
  END IF;
END $$;

SELECT cron.schedule(
  'send-appointment-reminders',
  '0 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://jnrprkdueseahfrguhvt.supabase.co/functions/v1/send-appointment-reminders',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
