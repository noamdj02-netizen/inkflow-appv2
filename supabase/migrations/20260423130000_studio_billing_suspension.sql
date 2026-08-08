-- États d'échec de paiement (abonnement plateforme) + compteur de tentatives
ALTER TABLE inkflow_studios DROP CONSTRAINT IF EXISTS inkflow_studios_subscription_status_check;

ALTER TABLE inkflow_studios
  ADD CONSTRAINT inkflow_studios_subscription_status_check
  CHECK (
    subscription_status IN (
      'trialing',
      'active',
      'restricted',
      'canceled',
      'past_due',
      'suspended'
    )
  );

COMMENT ON COLUMN inkflow_studios.subscription_status IS
  'Statut: trialing | active | restricted | canceled | past_due (paiement en retard) | suspended (3+ échecs de prélèvement)';

ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS subscription_billing_failures integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN inkflow_studios.subscription_billing_failures IS
  'Compteur d’invoice.payment_failed Stripe pour l’abonnement — reset au paiement réussi.';
