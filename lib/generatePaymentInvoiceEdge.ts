/**
 * Génération PDF côté serveur (Edge `generate-payment-invoice`) — fiable sur mobile / WebView.
 */
import { supabase } from './supabase';
import type {
  GeneratePaymentInvoicePayload,
  GeneratePaymentInvoiceResponse,
  PaymentInvoiceKind,
} from './automations/types';

function functionsBaseUrl(): string {
  const base = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  if (!base) throw new Error('VITE_SUPABASE_URL manquant');
  return `${base}/functions/v1`;
}

export async function invokeGeneratePaymentInvoice(
  payload: GeneratePaymentInvoicePayload
): Promise<GeneratePaymentInvoiceResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return { ok: false, error: 'Session requise' };
  }

  const res = await fetch(`${functionsBaseUrl()}/generate-payment-invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = (await res.json().catch(() => ({}))) as GeneratePaymentInvoiceResponse & {
    error?: string;
  };
  if (!res.ok) {
    return { ok: false, error: json.error || `HTTP ${res.status}` };
  }
  return json;
}

export type EdgeInvoiceDownloadParams = {
  studioId: string;
  appointmentId: string;
  paymentKind: PaymentInvoiceKind;
  amountPaidEur?: number;
  paymentReference?: string;
};
