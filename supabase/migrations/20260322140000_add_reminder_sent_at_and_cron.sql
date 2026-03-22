-- InkFlow: Relance automatique 12h si acompte non payé
-- 1) Colonne reminder_sent_at sur inkflow_appointments
-- 2) Cron pg_cron toutes les heures → Edge Function remind-unpaid-deposits

-- Colonne de tracking pour éviter les relances en double
ALTER TABLE inkflow_appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Index pour accélérer la requête cron (filtre sur status + deposit_paid + reminder_sent_at)
CREATE INDEX IF NOT EXISTS idx_appointments_reminder
  ON inkflow_appointments (studio_id, status, deposit_paid, reminder_sent_at, created_at)
  WHERE deposit_paid = false AND reminder_sent_at IS NULL;

-- Activer pg_cron si pas déjà fait (nécessite l'extension disponible sur Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Supprimer le cron existant si on le re-déploie (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'remind-unpaid-deposits') THEN
    PERFORM cron.unschedule('remind-unpaid-deposits');
  END IF;
END $$;

-- Planifier toutes les heures à :05 (laisse le temps aux webhooks Stripe)
-- La fonction est déployée --no-verify-jwt → pas besoin d'Authorization header depuis le cron
SELECT cron.schedule(
  'remind-unpaid-deposits',
  '5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jnrprkdueseahfrguhvt.supabase.co/functions/v1/remind-unpaid-deposits',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
