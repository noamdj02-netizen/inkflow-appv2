import { supabase } from './supabase';

interface CreateCheckoutParams {
  studioId: string;
  appointmentId: string;
  amount: number;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  type: 'deposit' | 'full_payment';
}

export type CreateCheckoutResult = { url: string } | { error: string };

export async function createCheckoutSession(params: CreateCheckoutParams): Promise<CreateCheckoutResult> {
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: params,
    });
    if (error) {
      let msg = error.message || (typeof error === 'string' ? error : 'Erreur inconnue');
      if (msg.includes('non-2xx status code')) {
        msg += ' Projet Supabase peut être en pause ou la fonction non déployée : restaure le projet puis exécute « npx supabase functions deploy create-checkout-session ».';
      }
      return { error: msg };
    }
    if (data?.url) return { url: data.url };
    const backendError = data?.error || data?.details;
    return { error: backendError || 'La fonction n\'a pas renvoyé de lien. Vérifiez les secrets (STRIPE_SECRET_KEY, SITE_URL) et redéployez.' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
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
