-- P0 sécurité InkCheck : pg_net → Edge Functions internes avec X-Inkflow-Secret (fail-closed côté Edge).
--
-- PRÉREQUIS fondateur (Supabase Dashboard → Project Settings → Vault) :
--   Créer un secret nommé exactement : internal_function_secret
--   Valeur identique à INTERNAL_FUNCTION_SECRET (Edge Functions secrets, ≥ 12 caractères).
--
-- Sans ce secret Vault, les triggers enverront un header vide → Edge renvoie 503 (comportement voulu).

CREATE OR REPLACE FUNCTION inkflow_pg_net_internal_headers()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'Content-Type', 'application/json',
    'X-Inkflow-Secret', COALESCE(
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'internal_function_secret' LIMIT 1),
      ''
    )
  );
$$;

COMMENT ON FUNCTION inkflow_pg_net_internal_headers() IS
  'Headers pg_net pour Edge Functions internes (post-appointment-closeout, process-stamp-loyalty-db). Lit vault.internal_function_secret.';

CREATE OR REPLACE FUNCTION inkflow_supabase_functions_base_url()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.settings.supabase_url', true), ''),
    'https://jnrprkdueseahfrguhvt.supabase.co'
  );
$$;

-- ─── post-appointment-closeout ───
CREATE OR REPLACE FUNCTION inkflow_trigger_post_appointment_closeout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF
    (NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed'))
    OR (NEW.balance_paid_at IS NOT NULL AND OLD.balance_paid_at IS NULL)
  THEN
    PERFORM net.http_post(
      url := inkflow_supabase_functions_base_url() || '/functions/v1/post-appointment-closeout',
      headers := inkflow_pg_net_internal_headers(),
      body := jsonb_build_object(
        'appointmentId', NEW.id::text,
        'studioId',      NEW.studio_id::text,
        'clientId',      COALESCE(NEW.client_id::text, ''),
        'clientEmail',   COALESCE(NEW.client_email, ''),
        'clientName',    COALESCE(NEW.client_name, NEW.client_email, ''),
        'event',         CASE
                          WHEN NEW.balance_paid_at IS NOT NULL AND OLD.balance_paid_at IS NULL THEN 'balance_paid'
                          ELSE 'completed'
                        END
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION inkflow_trigger_post_appointment_closeout() IS
  'Appelle post-appointment-closeout (push + deep link stock) — header X-Inkflow-Secret via vault.internal_function_secret.';

-- ─── process-stamp-loyalty-db ───
CREATE OR REPLACE FUNCTION inkflow_trigger_stamp_loyalty()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    PERFORM net.http_post(
      url := inkflow_supabase_functions_base_url() || '/functions/v1/process-stamp-loyalty-db',
      headers := inkflow_pg_net_internal_headers(),
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

COMMENT ON FUNCTION inkflow_trigger_stamp_loyalty() IS
  'Appelle process-stamp-loyalty-db via pg_net — header X-Inkflow-Secret via vault.internal_function_secret.';
