-- Lorsqu’un inkflow_consent_forms est signé avec appointment_id renseigné,
-- marquer consent_form_signed sur le rendez-vous associé (traçabilité séance / cockpit).

CREATE OR REPLACE FUNCTION public.inkflow_append_consent_note_to_client()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_line text;
BEGIN
  IF NEW.signed_at IS NULL OR NEW.signature_data IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.signed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_line :=
    'Consentement signé le '
    || to_char(NEW.signed_at AT TIME ZONE 'Europe/Paris', 'DD/MM/YYYY HH24:MI')
    || ' (réf. formulaire '
    || NEW.id
    || ').';

  UPDATE public.inkflow_clients c
  SET
    notes = CASE
      WHEN c.notes IS NULL OR trim(c.notes) = '' THEN v_line
      ELSE trim(c.notes) || E'\n\n' || v_line
    END,
    updated_at = now()
  WHERE c.studio_id = NEW.studio_id
    AND lower(trim(c.email)) = lower(trim(NEW.client_email));

  IF NEW.appointment_id IS NOT NULL THEN
    UPDATE public.inkflow_appointments a
    SET
      consent_form_signed = true,
      updated_at = now()
    WHERE a.id = NEW.appointment_id
      AND a.studio_id = NEW.studio_id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.inkflow_append_consent_note_to_client() IS
  'Après signature d’un inkflow_consent_forms : note CRM + si appointment_id défini, consent_form_signed sur le RDV.';
