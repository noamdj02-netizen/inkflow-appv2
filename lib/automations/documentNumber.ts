import type { PaymentInvoiceKind } from './types';

/**
 * Numéro de pièce unique affiché sur le PDF et utilisé comme nom de fichier.
 * Format : `FAC-SOL-20260518-A1B2C3` | `FAC-AC-20260518-A1B2C3` | `FAC-20260518-A1B2C3`
 */
export function factureDocumentNumber(
  appointmentId: string,
  paymentKind: PaymentInvoiceKind,
  emissionDate: Date = new Date()
): string {
  const ymd = emissionDate.toISOString().slice(0, 10).replace(/-/g, '');
  const tail =
    appointmentId
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(-6)
      .toUpperCase() || '000000';
  const prefix =
    paymentKind === 'balance' || paymentKind === 'manual_balance'
      ? 'FAC-SOL'
      : paymentKind === 'deposit'
        ? 'FAC-AC'
        : 'FAC';
  return `${prefix}-${ymd}-${tail}`;
}

/** Nom de fichier Storage : `{num_facture}.pdf` */
export function facturePdfFilename(documentNumber: string): string {
  const safe = documentNumber.replace(/[^\w.-]/g, '_');
  return `${safe}.pdf`;
}

/** Numéro de reçu (solde / acompte) — affiché dans l’aperçu client. */
export function receiptDocumentNumber(
  appointmentId: string,
  paymentKind: PaymentInvoiceKind,
  emissionDate: Date = new Date()
): string {
  const ymd = emissionDate.toISOString().slice(0, 10).replace(/-/g, '');
  const tail =
    appointmentId
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(-6)
      .toUpperCase() || '000000';
  const prefix =
    paymentKind === 'balance' || paymentKind === 'manual_balance'
      ? 'REC-SOL'
      : paymentKind === 'deposit'
        ? 'REC-AC'
        : 'REC';
  return `${prefix}-${ymd}-${tail}`;
}

/** Nom de fichier Storage pour reçus : `Recu_{num}.pdf` */
export function receiptPdfFilename(documentNumber: string): string {
  const safe = documentNumber.replace(/[^\w.-]/g, '_');
  return `Recu_${safe}.pdf`;
}

export function isReceiptPaymentKind(kind: PaymentInvoiceKind): boolean {
  return kind === 'balance' || kind === 'manual_balance' || kind === 'deposit';
}
