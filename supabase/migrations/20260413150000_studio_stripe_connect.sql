-- Stripe Connect : chaque studio encaisse sur son compte connecté (Express).
ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_connect_details_submitted BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN inkflow_studios.stripe_connect_account_id IS 'ID compte Stripe Connect (acct_xxx)';
COMMENT ON COLUMN inkflow_studios.stripe_connect_charges_enabled IS 'True quand Stripe autorise les encaissements (account.updated)';
COMMENT ON COLUMN inkflow_studios.stripe_connect_details_submitted IS 'Onboarding Stripe complété (soumis)';

CREATE INDEX IF NOT EXISTS idx_studios_stripe_connect_account
  ON inkflow_studios (stripe_connect_account_id)
  WHERE stripe_connect_account_id IS NOT NULL;
