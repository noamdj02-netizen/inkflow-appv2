-- Retire le cron pg_cron dont l’URL pointait vers un projet fixe (les envois J+7/J+30 ne partaient pas sur les autres projets).
-- À re-créer dans Supabase : Database → Cron / ou SQL avec l’URL du BON projet :
--   SELECT cron.schedule(
--     'send-loyalty-emails',
--     '0 10 * * *',
--     $$ SELECT net.http_post(
--       url := 'https://VOTRE_PROJECT_REF.supabase.co/functions/v1/send-loyalty-emails',
--       headers := '{"Content-Type": "application/json"}'::jsonb,
--       body := '{}'::jsonb
--     ) AS request_id; $$
--   );
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
     AND EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-loyalty-emails') THEN
    PERFORM cron.unschedule('send-loyalty-emails');
  END IF;
END $$;
