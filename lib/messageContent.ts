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

export type StructuredMessagePayload = PaymentCardPayload | PaymentReceiptPayload;

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
  } catch {
    return null;
  }
  return null;
}
