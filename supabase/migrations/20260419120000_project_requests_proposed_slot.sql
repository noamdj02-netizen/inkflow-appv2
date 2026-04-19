-- Option A sprint : créneau proposé par l'artiste lors de l'acceptation d'une demande projet
ALTER TABLE public.inkflow_project_requests
  ADD COLUMN IF NOT EXISTS proposed_slot TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS slot_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS artist_message TEXT;

COMMENT ON COLUMN public.inkflow_project_requests.proposed_slot IS 'Créneau proposé au client (acceptation)';
COMMENT ON COLUMN public.inkflow_project_requests.slot_expires_at IS 'Expiration de la proposition (ex. pour relance / paiement)';
COMMENT ON COLUMN public.inkflow_project_requests.artist_message IS 'Message libre de l’artiste au client (acceptation ou refus)';
