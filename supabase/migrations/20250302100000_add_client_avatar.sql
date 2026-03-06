-- Add avatar_url to inkflow_clients for profile photos (demo marketing, CRM)
ALTER TABLE inkflow_clients ADD COLUMN IF NOT EXISTS avatar_url TEXT;
