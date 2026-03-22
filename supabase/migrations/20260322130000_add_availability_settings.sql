-- InkFlow: Ajout availability_settings JSONB sur inkflow_studios
-- Permet aux tatoueurs de configurer leurs créneaux fixes, fenêtre d'ouverture, etc.
-- Structure JSON attendue:
-- {
--   "customSlots": ["10:30", "14:00", "15:30", "17:00"],  -- créneaux fixes (vide = DEFAULT_TIME_SLOTS)
--   "offDays": [0, 1],                                      -- jours désactivés (0=dim, 1=lun)
--   "bookingWindowDays": 60,                                -- nb jours à l'avance max
--   "blockedRanges": [                                      -- périodes bloquées
--     { "start": "2026-04-01", "end": "2026-04-07", "label": "Vacances" }
--   ]
-- }

ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS availability_settings JSONB DEFAULT '{}'::jsonb;

-- RLS: lecture publique (nécessaire pour la vitrine publique)
DROP POLICY IF EXISTS "Public read availability_settings" ON inkflow_studios;
CREATE POLICY "Public read availability_settings"
  ON inkflow_studios
  FOR SELECT
  USING (true);

-- RLS: écriture uniquement par le propriétaire du studio
DROP POLICY IF EXISTS "Owner update availability_settings" ON inkflow_studios;
CREATE POLICY "Owner update availability_settings"
  ON inkflow_studios
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
