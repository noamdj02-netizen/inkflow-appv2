-- Trigger d'automatisation fidélité tampons (P0-001)
-- Déclenche le traitement des timbres dès qu'un RDV passe à 'completed',
-- que ce soit via le frontend, un webhook Stripe, ou l'admin Supabase.
--
-- Requiert : pg_net (déjà activé dans 20260322160000_add_loyalty_tracking_and_cron.sql)

-- Fonction trigger
CREATE OR REPLACE FUNCTION inkflow_trigger_stamp_loyalty()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Seulement au passage initial vers 'completed' (évite doubles déclenchements)
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    PERFORM net.http_post(
      url     := 'https://jnrprkdueseahfrguhvt.supabase.co/functions/v1/process-stamp-loyalty-db',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body    := jsonb_build_object(
        'appointmentId', NEW.id::text,
        'studioId',      NEW.studio_id::text,
        'clientId',      COALESCE(NEW.client_id::text, ''),
        'clientEmail',   COALESCE(NEW.client_email, ''),
        'clientName',    COALESCE(NEW.client_name, NEW.client_email, '')
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger sur inkflow_appointments
DROP TRIGGER IF EXISTS trg_inkflow_stamp_loyalty ON inkflow_appointments;
CREATE TRIGGER trg_inkflow_stamp_loyalty
  AFTER UPDATE ON inkflow_appointments
  FOR EACH ROW
  EXECUTE FUNCTION inkflow_trigger_stamp_loyalty();

COMMENT ON FUNCTION inkflow_trigger_stamp_loyalty() IS
'Appelle process-stamp-loyalty-db via pg_net quand un RDV passe à completed. Idempotent côté edge function (inkflow_stamp_appointment_credits).';
