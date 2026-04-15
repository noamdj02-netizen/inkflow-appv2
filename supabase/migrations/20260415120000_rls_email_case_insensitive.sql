-- InkFlow : RLS — alignement e-mail JWT ↔ inkflow_studios.email (insensible à la casse + trim)
-- Corrige : sauvegardes paramètres / paiements refusées, « Studio introuvable » côté app,
-- alors que la ligne existe bien (ex. OAuth : Contact@… en JWT vs contact@… en base).

-- 1) Helpers
CREATE OR REPLACE FUNCTION public.inkflow_jwt_email_norm()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT lower(trim(COALESCE(auth.jwt()->>'email', '')));
$$;

COMMENT ON FUNCTION public.inkflow_jwt_email_norm() IS
  'E-mail utilisateur depuis le JWT, normalisé (minuscules + trim) pour comparaisons RLS.';

CREATE OR REPLACE FUNCTION public.inkflow_studio_ids_for_jwt()
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id
  FROM inkflow_studios s
  WHERE lower(trim(COALESCE(s.email, ''))) = lower(trim(COALESCE(auth.jwt()->>'email', '')));
$$;

COMMENT ON FUNCTION public.inkflow_studio_ids_for_jwt() IS
  'IDs des studios dont l’e-mail correspond au JWT (comparaison insensible à la casse).';

REVOKE ALL ON FUNCTION public.inkflow_jwt_email_norm() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inkflow_jwt_email_norm() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.inkflow_studio_ids_for_jwt() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inkflow_studio_ids_for_jwt() TO anon, authenticated;

-- ===== 2) inkflow_studios — ligne « mienne » par e-mail normalisé =====
DROP POLICY IF EXISTS "studios_select_own" ON inkflow_studios;
DROP POLICY IF EXISTS "studios_insert_own" ON inkflow_studios;
DROP POLICY IF EXISTS "studios_update_own" ON inkflow_studios;

CREATE POLICY "studios_select_own" ON inkflow_studios
  FOR SELECT
  USING (lower(trim(COALESCE(email, ''))) = public.inkflow_jwt_email_norm());

CREATE POLICY "studios_insert_own" ON inkflow_studios
  FOR INSERT
  WITH CHECK (lower(trim(COALESCE(email, ''))) = public.inkflow_jwt_email_norm());

CREATE POLICY "studios_update_own" ON inkflow_studios
  FOR UPDATE
  USING (lower(trim(COALESCE(email, ''))) = public.inkflow_jwt_email_norm());

-- ===== 3) Tables déjà scindées en 202503130 (clients, RDV, paiements, flash) =====
DROP POLICY IF EXISTS "clients_select_own" ON inkflow_clients;
DROP POLICY IF EXISTS "clients_insert_own" ON inkflow_clients;
DROP POLICY IF EXISTS "clients_update_own" ON inkflow_clients;
DROP POLICY IF EXISTS "clients_delete_own" ON inkflow_clients;

CREATE POLICY "clients_select_own" ON inkflow_clients FOR SELECT
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));
CREATE POLICY "clients_insert_own" ON inkflow_clients FOR INSERT
  WITH CHECK (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));
CREATE POLICY "clients_update_own" ON inkflow_clients FOR UPDATE
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));
CREATE POLICY "clients_delete_own" ON inkflow_clients FOR DELETE
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

DROP POLICY IF EXISTS "appointments_select_own" ON inkflow_appointments;
DROP POLICY IF EXISTS "appointments_insert_own" ON inkflow_appointments;
DROP POLICY IF EXISTS "appointments_update_own" ON inkflow_appointments;
DROP POLICY IF EXISTS "appointments_delete_own" ON inkflow_appointments;

CREATE POLICY "appointments_select_own" ON inkflow_appointments FOR SELECT
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));
CREATE POLICY "appointments_insert_own" ON inkflow_appointments FOR INSERT
  WITH CHECK (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));
CREATE POLICY "appointments_update_own" ON inkflow_appointments FOR UPDATE
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));
CREATE POLICY "appointments_delete_own" ON inkflow_appointments FOR DELETE
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

DROP POLICY IF EXISTS "payments_select_own" ON inkflow_payments;
DROP POLICY IF EXISTS "payments_insert_own" ON inkflow_payments;
DROP POLICY IF EXISTS "payments_update_own" ON inkflow_payments;
DROP POLICY IF EXISTS "payments_delete_own" ON inkflow_payments;

CREATE POLICY "payments_select_own" ON inkflow_payments FOR SELECT
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));
CREATE POLICY "payments_insert_own" ON inkflow_payments FOR INSERT
  WITH CHECK (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));
CREATE POLICY "payments_update_own" ON inkflow_payments FOR UPDATE
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));
CREATE POLICY "payments_delete_own" ON inkflow_payments FOR DELETE
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

DROP POLICY IF EXISTS "flash_select_own" ON inkflow_flash_designs;
DROP POLICY IF EXISTS "flash_insert_own" ON inkflow_flash_designs;
DROP POLICY IF EXISTS "flash_update_own" ON inkflow_flash_designs;
DROP POLICY IF EXISTS "flash_delete_own" ON inkflow_flash_designs;

CREATE POLICY "flash_select_own" ON inkflow_flash_designs FOR SELECT
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));
CREATE POLICY "flash_insert_own" ON inkflow_flash_designs FOR INSERT
  WITH CHECK (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));
CREATE POLICY "flash_update_own" ON inkflow_flash_designs FOR UPDATE
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));
CREATE POLICY "flash_delete_own" ON inkflow_flash_designs FOR DELETE
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

-- ===== 4) Tables historiques « FOR ALL » (20250218) — toujours actives si non remplacées =====
DROP POLICY IF EXISTS "payment_settings_owner" ON inkflow_payment_settings;
CREATE POLICY "payment_settings_owner" ON inkflow_payment_settings
  FOR ALL
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

DROP POLICY IF EXISTS "notifications_owner" ON inkflow_notifications;
CREATE POLICY "notifications_owner" ON inkflow_notifications
  FOR ALL
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

DROP POLICY IF EXISTS "vitrine_data_owner" ON inkflow_vitrine_data;
CREATE POLICY "vitrine_data_owner" ON inkflow_vitrine_data
  FOR ALL
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

DROP POLICY IF EXISTS "widgets_owner" ON inkflow_widgets;
CREATE POLICY "widgets_owner" ON inkflow_widgets
  FOR ALL
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

DROP POLICY IF EXISTS "vitrine_link_owner" ON inkflow_vitrine_link_settings;
CREATE POLICY "vitrine_link_owner" ON inkflow_vitrine_link_settings
  FOR ALL
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

DROP POLICY IF EXISTS "care_templates_owner" ON inkflow_care_templates;
CREATE POLICY "care_templates_owner" ON inkflow_care_templates
  FOR ALL
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

DROP POLICY IF EXISTS "client_notes_owner" ON inkflow_client_notes;
CREATE POLICY "client_notes_owner" ON inkflow_client_notes
  FOR ALL
  USING (
    client_id IN (
      SELECT id FROM inkflow_clients
      WHERE studio_id IN (SELECT public.inkflow_studio_ids_for_jwt())
    )
  );

DROP POLICY IF EXISTS "project_requests_owner" ON inkflow_project_requests;
CREATE POLICY "project_requests_owner" ON inkflow_project_requests
  FOR ALL
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

DROP POLICY IF EXISTS "subscriptions_owner" ON inkflow_subscriptions;
CREATE POLICY "subscriptions_owner" ON inkflow_subscriptions
  FOR ALL
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

DROP POLICY IF EXISTS "consent_forms_owner" ON inkflow_consent_forms;
CREATE POLICY "consent_forms_owner" ON inkflow_consent_forms
  FOR ALL
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

DROP POLICY IF EXISTS "reminder_logs_owner" ON inkflow_reminder_logs;
CREATE POLICY "reminder_logs_owner" ON inkflow_reminder_logs
  FOR ALL
  USING (
    appointment_id IN (
      SELECT id FROM inkflow_appointments
      WHERE studio_id IN (SELECT public.inkflow_studio_ids_for_jwt())
    )
  );

DROP POLICY IF EXISTS "messages_owner" ON inkflow_messages;
CREATE POLICY "messages_owner" ON inkflow_messages
  FOR ALL
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

DROP POLICY IF EXISTS "waitlist_owner" ON inkflow_waitlist;
CREATE POLICY "waitlist_owner" ON inkflow_waitlist
  FOR ALL
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

DROP POLICY IF EXISTS "artist_accounts_owner" ON inkflow_artist_accounts;
CREATE POLICY "artist_accounts_owner" ON inkflow_artist_accounts
  FOR ALL
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

DROP POLICY IF EXISTS "loyalty_owner" ON inkflow_loyalty;
CREATE POLICY "loyalty_owner" ON inkflow_loyalty
  FOR ALL
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

-- ===== 5) Bookings (demandes vitrine) — propriétaire studio =====
DROP POLICY IF EXISTS "bookings_owner" ON inkflow_bookings;
CREATE POLICY "bookings_owner" ON inkflow_bookings
  FOR ALL
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

-- ===== 6) Parrainage =====
DROP POLICY IF EXISTS "referrals_select_referrer" ON inkflow_referrals;
DROP POLICY IF EXISTS "referrals_insert_referee" ON inkflow_referrals;

CREATE POLICY "referrals_select_referrer" ON inkflow_referrals FOR SELECT
  USING (referrer_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

CREATE POLICY "referrals_insert_referee" ON inkflow_referrals FOR INSERT
  WITH CHECK (referee_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

-- ===== 7) Fidélité tampons (20260328120500) =====
DROP POLICY IF EXISTS "stamp_state_select" ON inkflow_client_stamp_state;
DROP POLICY IF EXISTS "stamp_state_insert" ON inkflow_client_stamp_state;
DROP POLICY IF EXISTS "stamp_state_update" ON inkflow_client_stamp_state;

CREATE POLICY "stamp_state_select" ON inkflow_client_stamp_state FOR SELECT
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));
CREATE POLICY "stamp_state_insert" ON inkflow_client_stamp_state FOR INSERT
  WITH CHECK (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));
CREATE POLICY "stamp_state_update" ON inkflow_client_stamp_state FOR UPDATE
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

DROP POLICY IF EXISTS "stamp_credits_select" ON inkflow_stamp_appointment_credits;
DROP POLICY IF EXISTS "stamp_credits_insert" ON inkflow_stamp_appointment_credits;

CREATE POLICY "stamp_credits_select" ON inkflow_stamp_appointment_credits FOR SELECT
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));
CREATE POLICY "stamp_credits_insert" ON inkflow_stamp_appointment_credits FOR INSERT
  WITH CHECK (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

DROP POLICY IF EXISTS "stamp_rewards_select" ON inkflow_stamp_rewards;
DROP POLICY IF EXISTS "stamp_rewards_insert" ON inkflow_stamp_rewards;
DROP POLICY IF EXISTS "stamp_rewards_update" ON inkflow_stamp_rewards;

CREATE POLICY "stamp_rewards_select" ON inkflow_stamp_rewards FOR SELECT
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));
CREATE POLICY "stamp_rewards_insert" ON inkflow_stamp_rewards FOR INSERT
  WITH CHECK (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));
CREATE POLICY "stamp_rewards_update" ON inkflow_stamp_rewards FOR UPDATE
  USING (studio_id IN (SELECT public.inkflow_studio_ids_for_jwt()));

-- ===== 8) Storage (avatars + portfolio) — même cause : sous-requête e-mail stricte =====
DROP POLICY IF EXISTS "avatar_insert_own_studio" ON storage.objects;
DROP POLICY IF EXISTS "avatar_update_own_studio" ON storage.objects;
DROP POLICY IF EXISTS "avatar_delete_own_studio" ON storage.objects;

CREATE POLICY "avatar_insert_own_studio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'avatars'
    AND split_part((storage.foldername(name))[2]::text, '.', 1) IN (SELECT public.inkflow_studio_ids_for_jwt())
  );

CREATE POLICY "avatar_update_own_studio"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'avatars'
    AND split_part((storage.foldername(name))[2]::text, '.', 1) IN (SELECT public.inkflow_studio_ids_for_jwt())
  );

CREATE POLICY "avatar_delete_own_studio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'avatars'
    AND split_part((storage.foldername(name))[2]::text, '.', 1) IN (SELECT public.inkflow_studio_ids_for_jwt())
  );

DROP POLICY IF EXISTS "portfolio_insert_own_studio" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_delete_own_studio" ON storage.objects;

CREATE POLICY "portfolio_insert_own_studio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'portfolio'
    AND (
      (storage.foldername(name))[2] IN (SELECT public.inkflow_studio_ids_for_jwt())
      OR (storage.foldername(name))[2] IN (
        SELECT s.slug FROM inkflow_studios s WHERE s.id IN (SELECT public.inkflow_studio_ids_for_jwt())
      )
    )
    AND storage.extension(name) IN ('jpg','jpeg','png','webp')
  );

CREATE POLICY "portfolio_delete_own_studio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'inkflow-assets'
    AND (storage.foldername(name))[1] = 'portfolio'
    AND (
      (storage.foldername(name))[2] IN (SELECT public.inkflow_studio_ids_for_jwt())
      OR (storage.foldername(name))[2] IN (
        SELECT s.slug FROM inkflow_studios s WHERE s.id IN (SELECT public.inkflow_studio_ids_for_jwt())
      )
    )
  );
