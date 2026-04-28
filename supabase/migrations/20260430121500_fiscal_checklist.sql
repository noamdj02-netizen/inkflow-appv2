-- Checklist mensuelle fiscal (PRD pilotage v2), par studio — RLS identique aux autres tables studio.

CREATE TABLE IF NOT EXISTS inkflow_fiscal_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  item_key TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false,
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (studio_id, month, item_key)
);

CREATE INDEX IF NOT EXISTS idx_fiscal_checklist_studio_month ON inkflow_fiscal_checklist(studio_id, month DESC);

COMMENT ON TABLE inkflow_fiscal_checklist IS 'Checklist mensuelle pilotage AE (cases cochées par studio ; month format YYYY-MM).';

ALTER TABLE inkflow_fiscal_checklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fiscal_checklist_select_own" ON inkflow_fiscal_checklist;
CREATE POLICY "fiscal_checklist_select_own" ON inkflow_fiscal_checklist FOR SELECT USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "fiscal_checklist_insert_own" ON inkflow_fiscal_checklist;
CREATE POLICY "fiscal_checklist_insert_own" ON inkflow_fiscal_checklist FOR INSERT WITH CHECK (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "fiscal_checklist_update_own" ON inkflow_fiscal_checklist;
CREATE POLICY "fiscal_checklist_update_own" ON inkflow_fiscal_checklist FOR UPDATE USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "fiscal_checklist_delete_own" ON inkflow_fiscal_checklist;
CREATE POLICY "fiscal_checklist_delete_own" ON inkflow_fiscal_checklist FOR DELETE USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "fiscal_checklist_svc" ON inkflow_fiscal_checklist;
CREATE POLICY "fiscal_checklist_svc" ON inkflow_fiscal_checklist FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
