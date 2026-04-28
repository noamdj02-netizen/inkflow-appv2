-- Push clôture séance (completed) — même mécanique que trg_inkflow_stamp_loyalty
CREATE OR REPLACE FUNCTION inkflow_trigger_post_appointment_closeout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    PERFORM net.http_post(
      url := 'https://jnrprkdueseahfrguhvt.supabase.co/functions/v1/post-appointment-closeout',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
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

DROP TRIGGER IF EXISTS trg_inkflow_post_appointment_closeout ON inkflow_appointments;
CREATE TRIGGER trg_inkflow_post_appointment_closeout
  AFTER UPDATE ON inkflow_appointments
  FOR EACH ROW
  EXECUTE FUNCTION inkflow_trigger_post_appointment_closeout();

COMMENT ON FUNCTION inkflow_trigger_post_appointment_closeout() IS
  'Appelle post-appointment-closeout (push + deep link stock) quand un RDV passe à completed.';
