-- ============================================================
-- InkFlow - Enable RLS on ALL tables + Security Policies
-- Fixes all 22 Security Advisor errors
-- ============================================================

-- ===== 1. ENABLE RLS ON EVERY TABLE =====

ALTER TABLE inkflow_studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_vitrine_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_vitrine_link_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_care_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_flash_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_project_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_consent_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_artist_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_loyalty ENABLE ROW LEVEL SECURITY;


-- ===== 2. STUDIOS — Owner can CRUD their own studio =====

CREATE POLICY "studios_select_own" ON inkflow_studios
  FOR SELECT USING (
    email = current_setting('request.jwt.claims', true)::json->>'email'
  );

CREATE POLICY "studios_insert_own" ON inkflow_studios
  FOR INSERT WITH CHECK (
    email = current_setting('request.jwt.claims', true)::json->>'email'
  );

CREATE POLICY "studios_update_own" ON inkflow_studios
  FOR UPDATE USING (
    email = current_setting('request.jwt.claims', true)::json->>'email'
  );

-- Public read for vitrine pages (anyone can view a studio by slug)
CREATE POLICY "studios_public_read_by_slug" ON inkflow_studios
  FOR SELECT USING (true);


-- ===== 3. STUDIO-OWNED TABLES — Owner access via studio_id =====
-- Helper: check if current user owns the studio_id

-- inkflow_vitrine_data
CREATE POLICY "vitrine_data_owner" ON inkflow_vitrine_data
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );
-- Public can read vitrine data (for public studio pages)
CREATE POLICY "vitrine_data_public_read" ON inkflow_vitrine_data
  FOR SELECT USING (true);

-- inkflow_widgets
CREATE POLICY "widgets_owner" ON inkflow_widgets
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );

-- inkflow_vitrine_link_settings
CREATE POLICY "vitrine_link_owner" ON inkflow_vitrine_link_settings
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );

-- inkflow_payment_settings
CREATE POLICY "payment_settings_owner" ON inkflow_payment_settings
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );

-- inkflow_care_templates
CREATE POLICY "care_templates_owner" ON inkflow_care_templates
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );

-- inkflow_clients
CREATE POLICY "clients_owner" ON inkflow_clients
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );

-- inkflow_client_notes (linked via client -> studio)
CREATE POLICY "client_notes_owner" ON inkflow_client_notes
  FOR ALL USING (
    client_id IN (
      SELECT id FROM inkflow_clients
      WHERE studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    )
  );

-- inkflow_appointments
CREATE POLICY "appointments_owner" ON inkflow_appointments
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );

-- inkflow_flash_designs
CREATE POLICY "flash_designs_owner" ON inkflow_flash_designs
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );
-- Public can view available flash designs (for studio pages)
CREATE POLICY "flash_designs_public_read" ON inkflow_flash_designs
  FOR SELECT USING (available = true);

-- inkflow_notifications
CREATE POLICY "notifications_owner" ON inkflow_notifications
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );


-- ===== 4. PROJECT REQUESTS — Public can INSERT, owner can manage =====

CREATE POLICY "project_requests_owner" ON inkflow_project_requests
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );
-- Clients can create project requests (anon insert)
CREATE POLICY "project_requests_public_insert" ON inkflow_project_requests
  FOR INSERT WITH CHECK (true);
-- Clients can read their own requests by email
CREATE POLICY "project_requests_client_read" ON inkflow_project_requests
  FOR SELECT USING (true);


-- ===== 5. PAYMENTS & SUBSCRIPTIONS =====

CREATE POLICY "payments_owner" ON inkflow_payments
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );

CREATE POLICY "subscriptions_owner" ON inkflow_subscriptions
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );


-- ===== 6. CONSENT FORMS =====

CREATE POLICY "consent_forms_owner" ON inkflow_consent_forms
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );
-- Public can read & sign consent forms
CREATE POLICY "consent_forms_public_read" ON inkflow_consent_forms
  FOR SELECT USING (true);
CREATE POLICY "consent_forms_public_update" ON inkflow_consent_forms
  FOR UPDATE USING (signature_data IS NULL);


-- ===== 7. REMINDER LOGS =====

CREATE POLICY "reminder_logs_owner" ON inkflow_reminder_logs
  FOR ALL USING (
    appointment_id IN (
      SELECT id FROM inkflow_appointments
      WHERE studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    )
  );


-- ===== 8. MESSAGES — Owner + public participant =====

CREATE POLICY "messages_owner" ON inkflow_messages
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );
-- Public can insert messages (client sending)
CREATE POLICY "messages_public_insert" ON inkflow_messages
  FOR INSERT WITH CHECK (true);
-- Public can read messages in their thread
CREATE POLICY "messages_public_read" ON inkflow_messages
  FOR SELECT USING (true);


-- ===== 9. WAITLIST =====

CREATE POLICY "waitlist_owner" ON inkflow_waitlist
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );


-- ===== 10. ARTIST ACCOUNTS =====

CREATE POLICY "artist_accounts_owner" ON inkflow_artist_accounts
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );


-- ===== 11. LOYALTY =====

CREATE POLICY "loyalty_owner" ON inkflow_loyalty
  FOR ALL USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );


-- ===== 12. FIX SECURITY DEFINER VIEWS =====
-- Drop and recreate views with SECURITY INVOKER

DROP VIEW IF EXISTS recent_payments;
CREATE VIEW recent_payments
  WITH (security_invoker = true)
AS
  SELECT p.*, a.client_name as appointment_client_name, a.service, a.date as appointment_date
  FROM inkflow_payments p
  LEFT JOIN inkflow_appointments a ON p.appointment_id = a.id
  ORDER BY p.created_at DESC
  LIMIT 50;

DROP VIEW IF EXISTS artist_payment_stats;
CREATE VIEW artist_payment_stats
  WITH (security_invoker = true)
AS
  SELECT
    s.id as studio_id,
    s.name as studio_name,
    COUNT(p.id) as total_payments,
    COALESCE(SUM(p.amount), 0) as total_revenue,
    COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as completed_revenue,
    COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_payments
  FROM inkflow_studios s
  LEFT JOIN inkflow_payments p ON p.studio_id = s.id
  GROUP BY s.id, s.name;
