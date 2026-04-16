-- Quand un consentement est signé (messagerie ou /consent/:id), ajoute une ligne dans les notes CRM
-- si une fiche client existe pour ce studio + e-mail.

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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_consent_signed_append_crm ON public.inkflow_consent_forms;
CREATE TRIGGER trg_consent_signed_append_crm
  AFTER UPDATE OF signed_at, signature_data ON public.inkflow_consent_forms
  FOR EACH ROW
  WHEN (NEW.signed_at IS NOT NULL AND NEW.signature_data IS NOT NULL)
  EXECUTE PROCEDURE public.inkflow_append_consent_note_to_client();

COMMENT ON FUNCTION public.inkflow_append_consent_note_to_client() IS
  'Après signature d’un inkflow_consent_forms, enrichit inkflow_clients.notes si une fiche existe (studio + e-mail).';
