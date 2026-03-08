-- Add widget_order to inkflow_widgets (ordre des widgets Vue d'ensemble)
ALTER TABLE inkflow_widgets ADD COLUMN IF NOT EXISTS widget_order JSONB DEFAULT '[]';
