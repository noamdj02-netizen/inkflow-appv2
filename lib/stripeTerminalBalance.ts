import { invokeEdgeFunctionViaFetch } from './edgeFunctionInvoke';

function readSecret(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const s = (data as { secret?: unknown }).secret;
  return typeof s === 'string' && s.trim() ? s.trim() : null;
}

function readIntentPayload(data: unknown): {
  clientSecret: string;
  paymentIntentId: string;
  paymentRecordId: string;
  amountEuros: number;
} | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  const clientSecret = typeof o.clientSecret === 'string' ? o.clientSecret : '';
  const paymentIntentId = typeof o.paymentIntentId === 'string' ? o.paymentIntentId : '';
  const paymentRecordId = typeof o.paymentRecordId === 'string' ? o.paymentRecordId : '';
  const amountEuros =
    typeof o.amountEuros === 'number' && Number.isFinite(o.amountEuros) ? o.amountEuros : NaN;
  if (!clientSecret.trim() || !paymentIntentId.trim()) return null;
  if (!paymentRecordId.trim() || Number.isNaN(amountEuros)) return null;
  return {
    clientSecret: clientSecret.trim(),
    paymentIntentId: paymentIntentId.trim(),
    paymentRecordId: paymentRecordId.trim(),
    amountEuros,
  };
}

/** Jeton de connexion lecteur (Stripe Terminal Web / Bluetooth). */
export async function stripeTerminalFetchConnectionSecret(
  studioId: string
): Promise<{ secret: string } | { error: string }> {
  const { data, error } = await invokeEdgeFunctionViaFetch('stripe-terminal', {
    action: 'connection_token',
    studioId,
  });
  if (error) return { error };
  const secret = readSecret(data);
  if (!secret) return { error: 'Réponse Terminal invalide (sans secret).' };
  return { secret };
}

/** Crée le PaymentIntent « solde » avec métadonnées webhook ; montant validé côté serveur. */
export async function stripeTerminalCreateBalanceIntent(input: {
  studioId: string;
  appointmentId: string;
  amountEuros: number;
}): Promise<
  | {
      clientSecret: string;
      paymentIntentId: string;
      paymentRecordId: string;
      amountEuros: number;
    }
  | { error: string }
> {
  const { data, error } = await invokeEdgeFunctionViaFetch('stripe-terminal', {
    action: 'create_payment_intent',
    studioId: input.studioId,
    appointmentId: input.appointmentId,
    amountEuros: input.amountEuros,
  });
  if (error) return { error };
  const parsed = readIntentPayload(data);
  if (!parsed) return { error: 'Réponse Terminal invalide (PaymentIntent).' };
  return parsed;
}
