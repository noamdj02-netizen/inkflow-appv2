/**
 * Valeurs de `inkflow_payments.status` (PostgreSQL).
 *
 * Ne pas confondre avec Stripe `CheckoutSession.payment_status` (`"paid"`, `"unpaid"`, …) :
 * côté InkFlow, un paiement Stripe réussi se matérialise ici par `COMPLETED`.
 */
export const INKFLOW_PAYMENT_RECORD_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export type InkflowPaymentRecordStatus =
  (typeof INKFLOW_PAYMENT_RECORD_STATUS)[keyof typeof INKFLOW_PAYMENT_RECORD_STATUS];
