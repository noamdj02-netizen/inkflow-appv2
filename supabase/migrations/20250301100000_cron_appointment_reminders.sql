-- Cron pour send-appointment-reminders (rappels J-1 et 2h avant)
-- Exécution toutes les heures à :00

-- Extensions requises (activer dans Dashboard → Database → Extensions si nécessaire)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Planification horaire (toutes les heures)
-- Prérequis : créer les secrets dans Vault (Dashboard > Project Settings > Vault) :
--   project_url : https://VOTRE_PROJECT_REF.supabase.co
--   anon_key    : votre clé anon (Settings > API)
SELECT cron.schedule(
  'send-appointment-reminders',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/send-appointment-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key'), '')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
