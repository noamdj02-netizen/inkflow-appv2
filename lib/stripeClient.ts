import { supabase } from './supabase';

interface CreateCheckoutParams {
  studioId: string;
  /** Slug public du studio pour les URLs de redirection Stripe (évite "Studio introuvable" après paiement). */
  studioSlug?: string;
  appointmentId: string;
  amount: number;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  type: 'deposit' | 'full_payment';
}

export type CreateCheckoutResult = { url: string } | { error: string };

const getSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return { url, key };
};

/** Appel direct à l'Edge Function pour pouvoir lire le corps d'erreur (message réel) en cas de non-2xx */
export async function createCheckoutSession(params: CreateCheckoutParams): Promise<CreateCheckoutResult> {
  const { url: baseUrl, key } = getSupabaseConfig();
  if (!baseUrl || !key) {
    return { error: 'Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).' };
  }
  const fnUrl = `${baseUrl.replace(/\/$/, '')}/functions/v1/create-checkout-session`;
  try {
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(params),
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string; details?: string };
    if (res.ok) {
      if (data?.url) return { url: data.url };
      return { error: data?.error || data?.details || 'La fonction n\'a pas renvoyé de lien.' };
    }
    const msg = data?.error || data?.details || data?.message || `Erreur ${res.status}`;
    if (res.status === 404 || res.status === 502) {
      return {
        error: `${msg} — Projet Supabase peut être en pause ou la fonction non déployée : restaure le projet puis exécute « npx supabase functions deploy create-checkout-session ».`,
      };
    }
    return { error: msg };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: `${message} — Vérifie la connexion et que l'Edge Function est déployée (npx supabase functions deploy create-checkout-session).`,
    };
  }
}

interface CreateSubscriptionParams {
  studioId: string;
  email: string;
  plan: 'solo' | 'studio';
  interval: 'monthly' | 'annual';
}

export async function createSubscription(params: CreateSubscriptionParams): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('create-subscription', {
      body: params,
    });
    if (error) {
      return null;
    }
    return data?.url || null;
  } catch (err) {
    return null;
  }
}
