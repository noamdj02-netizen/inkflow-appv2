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

export async function createCheckoutSession(params: CreateCheckoutParams): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: params,
    });
    if (error) {
      console.error('[stripeClient] Checkout error:', error);
      return null;
    }
    return data?.url || null;
  } catch (err) {
    console.error('[stripeClient] Unexpected error:', err);
    return null;
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
      console.error('[stripeClient] Subscription error:', error);
      return null;
    }
    return data?.url || null;
  } catch (err) {
    console.error('[stripeClient] Unexpected error:', err);
    return null;
  }
}
