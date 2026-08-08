-- Liaison directe questionnaire santé -> demande projet (custom)
-- Note: inkflow_project_requests.id est de type TEXT (pas UUID).

ALTER TABLE public.inkflow_health_forms
ADD COLUMN IF NOT EXISTS project_request_id TEXT REFERENCES public.inkflow_project_requests(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_health_forms_project_request_id
  ON public.inkflow_health_forms(project_request_id)
  WHERE project_request_id IS NOT NULL;

-- RLS: l'insertion publique est déjà autorisée via la policy existante
-- `health_forms_insert_anon` (WITH CHECK true). Rien à ajouter ici.

    