-- Préférences dashboard / modules par studio (JSONB versionné côté app — voir types/studioPreferences.ts)
ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS dashboard_preferences JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN inkflow_studios.dashboard_preferences IS
  'InkFlow: modules activés, ordre sidebar, layout vue d''ensemble (schema_version dans le JSON).';
