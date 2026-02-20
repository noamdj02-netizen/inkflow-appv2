-- Colonnes Google Calendar sur inkflow_studios
-- Pour stocker les tokens OAuth et l'ID de l'agenda InkFlow
ALTER TABLE inkflow_studios ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE inkflow_studios ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE inkflow_studios ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;
ALTER TABLE inkflow_studios ADD COLUMN IF NOT EXISTS google_token_expiry BIGINT;
