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

const TRUSTED_PAYMENT_LINK_HOSTS = new Set([
  'checkout.stripe.com',
  'billing.stripe.com',
  'buy.stripe.com',
  'pay.stripe.com',
  'app.ink-flow.me',
]);

function isTrustedPaymentUrl(raw: unknown): raw is string {
  if (typeof raw !== 'string' || !raw.trim()) return false;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return false;
    if (TRUSTED_PAYMENT_LINK_HOSTS.has(url.hostname)) return true;
    return url.hostname.endsWith('.stripe.com');
  } catch {
    return false;
  }
}

export function tryParseStructuredMessage(content: string): StructuredMessagePayload | null {
  const t = content.trim();
  if (!t.startsWith('{')) return null;
  try {
    const o = JSON.parse(t) as Record<string, unknown>;
    if (
      o.kind === 'payment_card' &&
      isTrustedPaymentUrl(o.checkoutUrl) &&
      typeof o.amount === 'number'
    ) {
      return {
        kind: 'payment_card',
        amount: o.amount,
        currency: typeof o.currency === 'string' ? o.currency : undefined,
        checkoutUrl: o.checkoutUrl,
        stripeSessionId: typeof o.stripeSessionId === 'string' ? o.stripeSessionId : undefined,
      };
    }
    if (o.kind === 'payment_receipt' && typeof o.amount === 'number') {
      const receiptUrl = isTrustedPaymentUrl(o.receiptUrl) ? o.receiptUrl : undefined;
      return {
        kind: 'payment_receipt',
        amount: o.amount,
        currency: typeof o.currency === 'string' ? o.currency : undefined,
        receiptUrl,
        stripeSessionId: typeof o.stripeSessionId === 'string' ? o.stripeSessionId : undefined,
      };
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
