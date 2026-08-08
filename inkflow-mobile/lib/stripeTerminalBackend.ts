import { invokeEdgeFunctionViaFetch } from './invokeEdgeFunction';

function readSecret(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const s = (data as { secret?: unknown }).secret;
  return typeof s === 'string' && s.trim() ? s.trim() : null;
}

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

export async function stripeTerminalEnsureLocation(studioId: string): Promise<
  | {
      locationId: string;
      merchantDisplayName: string;
      connectAccountId: string;
    }
  | { error: string }
> {
  const { data, error } = await invokeEdgeFunctionViaFetch('stripe-terminal', {
    action: 'ensure_terminal_location',
    studioId,
  });
  if (error) return { error };
  if (!data || typeof data !== 'object') return { error: 'Réponse lieu Terminal invalide.' };
  const o = data as Record<string, unknown>;
  const locationId = typeof o.locationId === 'string' ? o.locationId.trim() : '';
  const merchantDisplayName =
    typeof o.merchantDisplayName === 'string' ? o.merchantDisplayName.trim() : 'Studio';
  const connectAccountId = typeof o.connectAccountId === 'string' ? o.connectAccountId.trim() : '';
  if (!locationId || !connectAccountId) return { error: 'Réponse lieu Terminal incomplète.' };
  return { locationId, merchantDisplayName, connectAccountId };
}

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
  if (!data || typeof data !== 'object') return { error: 'Réponse PaymentIntent invalide.' };
  const o = data as Record<string, unknown>;
  const clientSecret = typeof o.clientSecret === 'string' ? o.clientSecret : '';
  const paymentIntentId = typeof o.paymentIntentId === 'string' ? o.paymentIntentId : '';
  const paymentRecordId = typeof o.paymentRecordId === 'string' ? o.paymentRecordId : '';
  const amountEuros =
    typeof o.amountEuros === 'number' && Number.isFinite(o.amountEuros) ? o.amountEuros : NaN;
  if (!clientSecret.trim() || !paymentIntentId.trim() || !paymentRecordId.trim() || Number.isNaN(amountEuros)) {
    return { error: 'Réponse Terminal invalide (PaymentIntent).' };
  }
  return {
    clientSecret: clientSecret.trim(),
    paymentIntentId: paymentIntentId.trim(),
    paymentRecordId: paymentRecordId.trim(),
    amountEuros,
  };
}
