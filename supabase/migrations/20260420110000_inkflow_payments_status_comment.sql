-- Convention statut enregistré en base (≠ Stripe payment_status).
COMMENT ON COLUMN public.inkflow_payments.status IS
  'InkFlow: pending | completed | failed | refunded. Un paiement Checkout Stripe réussi → completed (pas le mot paid).';
