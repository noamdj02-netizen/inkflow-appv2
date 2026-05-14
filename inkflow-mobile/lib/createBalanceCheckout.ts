/**
 * Crée une session Stripe Checkout (solde RDV) depuis le shell mobile — même Edge que le web (anon).
 * Expo Go ne peut pas embarquer Terminal natif ; ce flux reste utilisable pour encaisser réellement.
 */
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const MSG_GENERIC =
  "Impossible d'ouvrir le paiement pour le moment. Réessaie dans quelques minutes.";

function getPublicConfig(): { url: string; key: string } {
  const url = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/$/, '');
  const key = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
  return { url, key };
}

export async function loadAppointmentCheckoutContext(
  studioId: string,
  appointmentId: string
): Promise<
  | {
      ok: true;
      clientName: string;
      clientEmail: string;
      serviceName: string;
      studioSlug: string | null;
    }
  | { ok: false; error: string }
> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, error: 'Supabase non configuré dans inkflow-mobile (.env).' };
  }
  const { data: apt, error: aptErr } = await supabase
    .from('inkflow_appointments')
    .select('client_name, client_email, service, studio_id')
    .eq('id', appointmentId)
    .eq('studio_id', studioId)
    .maybeSingle();

  if (aptErr || !apt) {
    return { ok: false, error: 'Rendez-vous introuvable ou accès refusé. Reconnecte-toi.' };
  }

  const { data: studio } = await supabase
    .from('inkflow_studios')
    .select('slug')
    .eq('id', studioId)
    .maybeSingle();

  return {
    ok: true,
    clientName: apt.client_name,
    clientEmail: apt.client_email,
    serviceName: (apt.service && apt.service.trim()) || 'Séance',
    studioSlug: studio?.slug ?? null,
  };
}

function friendlyCheckoutError(
  status: number,
  data: { error?: string; details?: string; message?: string; code?: string }
): string {
  const raw = (data.error || data.details || data.message || '').trim();
  const code = data.code;
  if (status === 409 && code === 'stripe_connect_required') {
    return 'Paiements en ligne non activés (Stripe Connect). Paramètres → Paiements.';
  }
  if (status === 429) {
    return raw.includes('minute') ? raw : 'Trop de tentatives. Réessaie dans une minute.';
  }
  if (status === 400) {
    return raw || MSG_GENERIC;
  }
  if (status === 404) {
    return 'Studio introuvable.';
  }
  if (status === 503 || status >= 500) {
    return MSG_GENERIC;
  }
  if (raw && raw.length <= 280) return raw;
  return MSG_GENERIC;
}

export async function createBalanceCheckoutSession(params: {
  studioId: string;
  studioSlug?: string | null;
  appointmentId: string;
  amountEuros: number;
  clientName: string;
  clientEmail: string;
  serviceName: string;
}): Promise<{ url: string } | { error: string }> {
  const { url: baseUrl, key } = getPublicConfig();
  if (!baseUrl || !key) {
    return { error: 'Supabase non configuré (EXPO_PUBLIC_SUPABASE_URL / ANON_KEY).' };
  }

  const fnUrl = `${baseUrl}/functions/v1/create-checkout-session`;
  try {
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
      body: JSON.stringify({
        studioId: params.studioId,
        ...(params.studioSlug ? { studioSlug: params.studioSlug } : {}),
        appointmentId: params.appointmentId,
        amount: params.amountEuros,
        clientName: params.clientName,
        clientEmail: params.clientEmail,
        serviceName: params.serviceName,
        type: 'balance',
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
      details?: string;
      message?: string;
      code?: string;
    };

    if (res.ok && data?.url) {
      return { url: data.url };
    }
    return { error: friendlyCheckoutError(res.status, data) };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message === 'Failed to fetch') {
      return { error: 'Connexion instable. Vérifie le réseau.' };
    }
    return { error: MSG_GENERIC };
  }
}
