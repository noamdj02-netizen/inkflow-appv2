import { supabase } from './supabase';

interface CreateCheckoutParams {
  studioId: string;
  /** Slug public du studio pour les URLs de redirection Stripe (évite "Studio introuvable" après paiement). */
  studioSlug?: string;
  appointmentId: string;
  /** ID du flash (vitrine) — utilisé pour mettre available=false à l'acompte payé. */
  flashId?: string;
  /** Montant en euros (ex: 50 pour 50€). Le backend convertit en centimes pour Stripe. */
  amount: number;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  type: 'deposit' | 'full_payment';
  /** Zone du corps choisie par le client (flash). */
  placement?: string;
  /** Notes libres (précisions taille, côté, etc.). */
  clientNotes?: string;
  /** Instagram du client (optionnel). */
  clientInstagram?: string;
}

export type CreateCheckoutResult = { url: string } | { error: string };

export type CreateThemeCheckoutResult = { url: string } | { error: string };

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
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string; details?: string; message?: string };
    if (res.ok) {
      if (data?.url) return { url: data.url };
      return { error: data?.error || data?.details || 'La fonction n\'a pas renvoyé de lien.' };
    }
    const msg = data?.error || data?.details || data?.message || `Erreur ${res.status}`;
    if (res.status === 502 && typeof data?.details === 'string') {
      const details = data.details;
      if (details.includes('secret_key_required') || details.includes('publishable')) {
        return {
          error: 'Clé Stripe incorrecte : utilise la clé secrète (sk_live_ ou sk_test_) dans Supabase → Edge Functions → Secrets → STRIPE_SECRET_KEY, puis redéploie la fonction.',
        };
      }
      if (details.includes('Invalid API Key') || details.includes('invalid_request_error')) {
        return {
          error: 'Clé Stripe invalide. Vérifie STRIPE_SECRET_KEY dans Supabase Secrets (sk_...) et redéploie : npx supabase functions deploy create-checkout-session',
        };
      }
    }
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

/** Crée une session Stripe Checkout pour l'achat d'un thème PRO (2,99 €). Redirige vers Stripe. */
export async function createThemeCheckoutSession(params: {
  studioId: string;
  themeId: string;
  userEmail: string;
}): Promise<CreateThemeCheckoutResult> {
  const { url: baseUrl, key } = getSupabaseConfig();
  if (!baseUrl || !key) {
    return { error: 'Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).' };
  }
  const fnUrl = `${baseUrl.replace(/\/$/, '')}/functions/v1/create-theme-checkout-session`;
  try {
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(params),
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string; details?: string; message?: string };
    if (res.ok) {
      if (data?.url) return { url: data.url };
      return { error: data?.error || data?.details || 'La fonction n\'a pas renvoyé de lien.' };
    }
    const msg = data?.error || data?.details || data?.message || `Erreur ${res.status}`;
    return { error: msg };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: `${message} — Vérifie la connexion et que l'Edge Function create-theme-checkout-session est déployée.`,
    };
  }
}

interface CreateSubscriptionParams {
  studioId: string;
  email: string;
  plan: 'solo' | 'pro' | 'studio';
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

export type CreatePortalSessionResult = { url: string } | { error: string };

/** Crée une session du Customer Portal Stripe pour gérer l'abonnement (facture, paiement, annulation). */
export async function createPortalSession(params: {
  studioId?: string;
  email?: string;
}): Promise<CreatePortalSessionResult> {
  const { url: baseUrl, key } = getSupabaseConfig();
  if (!baseUrl || !key) return { error: 'Supabase non configuré.' };

  try {
    const fnUrl = `${baseUrl.replace(/\/$/, '')}/functions/v1/create-portal-session`;

    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(params),
    });

    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string; details?: string; message?: string };

    if (res.ok && data?.url) return { url: data.url };

    const msg = data?.error || data?.details || data?.message || `Erreur ${res.status}`;
    return { error: msg };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: message === 'Failed to fetch'
        ? 'Impossible de contacter le serveur. Vérifiez votre connexion et que l\'Edge Function create-portal-session est déployée (npx supabase functions deploy create-portal-session --no-verify-jwt).'
        : message,
    };
  }
}
