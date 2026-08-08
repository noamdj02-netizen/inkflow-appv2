-- Index liste documents par client (aperçu client — devis & reçus).
-- Table métier : inkflow_payment_invoices (type via payment_kind, fichier via storage_path / public_url).

CREATE INDEX IF NOT EXISTS inkflow_payment_invoices_client_idx
  ON public.inkflow_payment_invoices (studio_id, client_id, created_at DESC)
  WHERE client_id IS NOT NULL;

COMMENT ON TABLE public.inkflow_payment_invoices IS
  'Journal des pièces PDF client (reçus & factures). Storage : inkflow-assets/client-dossier/{studio_id}/{client_id}/';
