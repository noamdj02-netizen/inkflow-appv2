-- Factures PDF auto après encaissement (Stripe ou manuel dashboard).
-- Colonne métier : payment_kind (alias conceptuel « kind » dans la spec produit).

CREATE TABLE IF NOT EXISTS public.inkflow_payment_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id text NOT NULL REFERENCES public.inkflow_studios(id) ON DELETE CASCADE,
  appointment_id text NOT NULL,
  client_id text REFERENCES public.inkflow_clients(id) ON DELETE SET NULL,
  payment_kind text NOT NULL CHECK (
    payment_kind IN ('deposit', 'balance', 'full_payment', 'manual_balance')
  ),
  payment_reference text,
  document_number text NOT NULL,
  storage_path text,
  public_url text,
  amount_paid_eur numeric(10, 2) NOT NULL DEFAULT 0,
  total_eur numeric(10, 2),
  deposit_eur numeric(10, 2),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inkflow_payment_invoices_unique_kind
    UNIQUE (studio_id, appointment_id, payment_kind)
);

CREATE INDEX IF NOT EXISTS inkflow_payment_invoices_studio_created_idx
  ON public.inkflow_payment_invoices (studio_id, created_at DESC);

CREATE INDEX IF NOT EXISTS inkflow_payment_invoices_appointment_idx
  ON public.inkflow_payment_invoices (appointment_id);

COMMENT ON TABLE public.inkflow_payment_invoices IS
  'Journal des factures PDF (Storage client-dossier + numéro FAC-*).';
COMMENT ON COLUMN public.inkflow_payment_invoices.payment_kind IS
  'Type encaissement : deposit | balance | full_payment | manual_balance';

ALTER TABLE public.inkflow_payment_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inkflow_payment_invoices_select_own ON public.inkflow_payment_invoices;
DROP POLICY IF EXISTS inkflow_payment_invoices_insert_own ON public.inkflow_payment_invoices;
DROP POLICY IF EXISTS inkflow_payment_invoices_update_own ON public.inkflow_payment_invoices;

CREATE POLICY inkflow_payment_invoices_select_own
  ON public.inkflow_payment_invoices FOR SELECT
  TO authenticated
  USING (
    studio_id IN (
      SELECT id FROM public.inkflow_studios
      WHERE lower(trim(email)) = lower(trim(COALESCE(auth.jwt()->>'email', '')))
    )
  );

CREATE POLICY inkflow_payment_invoices_insert_own
  ON public.inkflow_payment_invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    studio_id IN (
      SELECT id FROM public.inkflow_studios
      WHERE lower(trim(email)) = lower(trim(COALESCE(auth.jwt()->>'email', '')))
    )
  );

CREATE POLICY inkflow_payment_invoices_update_own
  ON public.inkflow_payment_invoices FOR UPDATE
  TO authenticated
  USING (
    studio_id IN (
      SELECT id FROM public.inkflow_studios
      WHERE lower(trim(email)) = lower(trim(COALESCE(auth.jwt()->>'email', '')))
    )
  )
  WITH CHECK (
    studio_id IN (
      SELECT id FROM public.inkflow_studios
      WHERE lower(trim(email)) = lower(trim(COALESCE(auth.jwt()->>'email', '')))
    )
  );
