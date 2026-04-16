/**
 * Messages structurés dans inkflow_messages.content (JSON) pour cartes paiement / reçus.
 */

export type PaymentMessageKind = 'payment_card' | 'payment_receipt';

export interface PaymentCardPayload {
  kind: 'payment_card';
  amount: number;
  currency?: string;
  checkoutUrl: string;
  /** id session Stripe pour traçabilité */
  stripeSessionId?: string;
}

export interface PaymentReceiptPayload {
  kind: 'payment_receipt';
  amount: number;
  currency?: string;
  receiptUrl?: string;
  stripeSessionId?: string;
}

/** Formulaire de consentement à remplir dans le fil (ligne inkflow_consent_forms créée côté studio). */
export interface ConsentFormRequestPayload {
  kind: 'consent_form_request';
  consentFormId: string;
  title: string;
}

export type StructuredMessagePayload =
  | PaymentCardPayload
  | PaymentReceiptPayload
  | ConsentFormRequestPayload;

export function tryParseStructuredMessage(content: string): StructuredMessagePayload | null {
  const t = content.trim();
  if (!t.startsWith('{')) return null;
  try {
    const o = JSON.parse(t) as Record<string, unknown>;
    if (o.kind === 'payment_card' && typeof o.checkoutUrl === 'string' && typeof o.amount === 'number') {
      return o as unknown as PaymentCardPayload;
    }
    if (o.kind === 'payment_receipt' && typeof o.amount === 'number') {
      return o as unknown as PaymentReceiptPayload;
    }
    if (
      o.kind === 'consent_form_request' &&
      typeof o.consentFormId === 'string' &&
      o.consentFormId.length > 0 &&
      typeof o.title === 'string'
    ) {
      return {
        kind: 'consent_form_request',
        consentFormId: o.consentFormId,
        title: o.title,
      };
    }
  } catch {
    return null;
  }
  return null;
}
