-- Colonnes requises par l'Edge Function google-calendar-sync (push_one, push_all, pull, delete)
ALTER TABLE inkflow_appointments
  ADD COLUMN IF NOT EXISTS google_event_id TEXT,
  ADD COLUMN IF NOT EXISTS calendar_synced_at TIMESTAMPTZ;
