/** Types — automatisations post-paiement InkFlow (facture PDF, dossier client). */

/** Type de paiement déclenchant la facture. */
export type PaymentInvoiceKind = 'deposit' | 'balance' | 'full_payment' | 'manual_balance';

/** Résultat de `handleClientPaymentSuccess` ou de l’Edge `generate-payment-invoice`. */
export interface PaymentAutomationResult {
  ok: boolean;
  /** Facture déjà présente (idempotence). */
  skipped?: boolean;
  reason?: string;
  documentNumber?: string;
  filename?: string;
  storagePath?: string;
  publicUrl?: string;
  savedToDossier: boolean;
  downloaded: boolean;
}

/** Paramètres d’entrée de l’orchestrateur client (encaissement manuel dashboard). */
export interface HandleClientPaymentSuccessParams {
  appointmentId: string;
  studioId: string;
  paymentKind: PaymentInvoiceKind;
  /** Montant encaissé lors de cet événement (€ TTC). */
  amountPaidEur: number;
  /** Référence Stripe (`cs_…`, `pi_…`) ou `manual-{iso}`. */
  paymentReference?: string;
  /** Téléchargement immédiat du PDF pour le tatoueur. */
  downloadPdf?: boolean;
  /** Court-circuite si une facture du même `payment_kind` existe déjà. */
  skipIfExists?: boolean;
}

/** Ligne `inkflow_payment_invoices` (journal + lien Storage). */
export interface PaymentInvoiceRow {
  id: string;
  studio_id: string;
  appointment_id: string;
  client_id: string | null;
  payment_kind: PaymentInvoiceKind;
  payment_reference: string | null;
  document_number: string;
  storage_path: string | null;
  public_url: string | null;
  amount_paid_eur: number;
  total_eur: number | null;
  deposit_eur: number | null;
  created_at: string;
}

/** Payload Edge Function `generate-payment-invoice`. */
export interface GeneratePaymentInvoicePayload {
  studioId: string;
  appointmentId: string;
  paymentKind: PaymentInvoiceKind;
  amountPaidEur?: number;
  paymentReference?: string;
}

/** Réponse Edge Function. */
export interface GeneratePaymentInvoiceResponse {
  ok: boolean;
  skipped?: boolean;
  documentNumber?: string;
  filename?: string;
  storagePath?: string | null;
  publicUrl?: string | null;
  savedToDossier?: boolean;
  error?: string;
}
