-- InkCheck — resserre consent + health : JWT studio explicite ; health anon lié à un RDV pending réel.

-- ── Consent : remplace FOR ALL par politiques explicites (studio appelant uniquement) ──
DROP POLICY IF EXISTS "consent_forms_owner" ON public.inkflow_consent_forms;

CREATE POLICY "consent_forms_select_mine" ON public.inkflow_consent_forms
  FOR SELECT
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

CREATE POLICY "consent_forms_insert_mine" ON public.inkflow_consent_forms
  FOR INSERT
  WITH CHECK (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

CREATE POLICY "consent_forms_update_mine" ON public.inkflow_consent_forms
  FOR UPDATE
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()))
  WITH CHECK (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

CREATE POLICY "consent_forms_delete_mine" ON public.inkflow_consent_forms
  FOR DELETE
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

-- ── Health : lecture / update — même studio JWT ; insert public — lien appointment pending ──
DROP POLICY IF EXISTS "health_forms_insert_public_booking" ON public.inkflow_health_forms;
DROP POLICY IF EXISTS "health_forms_select_owner" ON public.inkflow_health_forms;
DROP POLICY IF EXISTS "health_forms_update_owner" ON public.inkflow_health_forms;

CREATE POLICY "health_forms_select_owner" ON public.inkflow_health_forms
  FOR SELECT
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

CREATE POLICY "health_forms_update_owner" ON public.inkflow_health_forms
  FOR UPDATE
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()))
  WITH CHECK (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

CREATE POLICY "health_forms_insert_public_with_appointment" ON public.inkflow_health_forms
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    appointment_id IS NOT NULL
    AND length(trim(appointment_id)) >= 8
    AND EXISTS (
      SELECT 1
      FROM public.inkflow_appointments a
      WHERE a.id = appointment_id
        AND a.studio_id = studio_id
        AND lower(trim(a.client_email)) = lower(trim(client_email))
        AND coalesce(a.status, 'pending') = 'pending'
        AND coalesce(a.deposit_paid, false) = false
    )
    AND length(trim(client_email)) >= 3
    AND length(trim(client_name)) >= 1
    AND health_data IS NOT NULL
  );

COMMENT ON POLICY "health_forms_insert_public_with_appointment" ON public.inkflow_health_forms IS
  'Questionnaire santé vitrine : uniquement si un RDV pending existe pour le même studio + e-mail client.';
