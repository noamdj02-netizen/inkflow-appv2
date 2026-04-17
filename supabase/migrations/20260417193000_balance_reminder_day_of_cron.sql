-- Rappel tatoueur : solde restant le jour J (Edge Function remind-balance-day-of)
-- 1) Colonne anti-doublon (un seul e-mail par RDV)
-- 2) Cron pg_cron quotidien — à adapter : URL du projet + fuseau (voir commentaires)

ALTER TABLE inkflow_appointments
  ADD COLUMN IF NOT EXISTS balance_reminder_sent_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN inkflow_appointments.balance_reminder_sent_at IS
  'Horodatage envoi e-mail « solde à encaisser » (jour du RDV, remind-balance-day-of).';

CREATE INDEX IF NOT EXISTS idx_appointments_balance_reminder_day
  ON inkflow_appointments (date, status)
  WHERE balance_reminder_sent_at IS NULL;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Déplanifier l’ancienne version si re-déploiement (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'remind-balance-day-of') THEN
    PERFORM cron.unschedule('remind-balance-day-of');
  END IF;
END $$;

-- 8h00 heure de Paris en hiver (UTC+1) ≈ 7h UTC. Ajuster en été (6h UTC) ou selon votre fuseau.
-- Remplacez l’URL par : https://<PROJECT_REF>.supabase.co/functions/v1/remind-balance-day-of
-- Si EDGE_CRON_SECRET est défini, ajoutez l’en-tête x-cron-secret via le SQL Editor (voir docs Supabase) ou appelez sans secret tant que verify_jwt = false.
SELECT cron.schedule(
  'remind-balance-day-of',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jnrprkdueseahfrguhvt.supabase.co/functions/v1/remind-balance-day-of',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
