import { isAccessTokenForCurrentSupabaseProject, supabase } from './supabase';
import { ensureStudio, getStudioByEmail } from './supabaseDashboard';

interface CreateCheckoutParams {
  studioId: string;
  /** Slug public du studio pour les URLs de redirection Stripe (évite "Studio introuvable" après paiement). */
  studioSlug?: string;
  /** Vide pour paiement flash vitrine sans RDV préalable. */
  appointmentId?: string;
  /** ID du flash (vitrine) — utilisé pour mettre available=false à l'acompte payé. */
  flashId?: string;
  /** Montant en euros (ex: 50 pour 50€). Le backend convertit en centimes pour Stripe. */
  amount: number;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  type: 'deposit' | 'full_payment' | 'balance';
  /** Zone du corps choisie par le client (flash). */
  placement?: string;
  /** Notes libres (précisions taille, côté, etc.). */
  clientNotes?: string;
  /** Instagram du client (optionnel). */
  clientInstagram?: string;
  /** Demande projet vitrine (métadonnées Stripe + webhook). */
  projectRequestId?: string;
  /** Fil messagerie (ex. pr_xxx). */
  threadId?: string;
  /** Compte espace client (Supabase Auth) — le webhook rattache le questionnaire à la fiche CRM. */
  clientPortalUserId?: string;
}

export type CreateCheckoutResult = { url: string; sessionId?: string } | { error: string };

export type CreateThemeCheckoutResult = { url: string } | { error: string };

/** Message affiché au client final (réservation publique) — jamais de secrets ni de commandes CLI. */
const MSG_CHECKOUT_GENERIC =
  "Impossible d'ouvrir la page de paiement pour le moment. Réessayez dans quelques minutes ou contactez le studio.";

function looksLikeTechnicalError(message: string): boolean {
  const t = message.toLowerCase();
  return /sk_live|sk_test|stripe_secret|supabase|npx\s|edge function|deploy|secret_key|vercel|invalid api key|configuration stripe/i.test(
    t
  );
}

/**
 * Libellé lisible pour les erreurs create-checkout-session (clients + dashboard).
 * Les détails techniques sont uniquement dans la console.
 */
function userMessageForCheckoutFailure(
  status: number,
  data: {
    error?: string;
    details?: string;
    message?: string;
    code?: string;
  }
): string {
  const raw = (data.error || data.details || data.message || '').trim();
  const code = data.code;

  if (status === 409 && code === 'stripe_connect_required') {
    return 'Les paiements en ligne ne sont pas encore activés pour ce studio. Contactez-le pour régler votre acompte.';
  }
  if (status === 429) {
    return raw.includes('minute') || raw.includes('requêtes')
      ? raw
      : 'Trop de tentatives. Réessayez dans une minute.';
  }
  if (status === 400) {
    return raw || MSG_CHECKOUT_GENERIC;
  }
  if (status === 404) {
    return 'Ce studio est introuvable ou le lien n’est plus valide.';
  }
  if (status === 503) {
    return raw || 'Le paiement en ligne est momentanément indisponible. Réessayez plus tard.';
  }
  if (status >= 500 || status === 502) {
    return MSG_CHECKOUT_GENERIC;
  }
  if (raw && !looksLikeTechnicalError(raw)) {
    return raw.length > 280 ? `${raw.slice(0, 277)}…` : raw;
  }
  return MSG_CHECKOUT_GENERIC;
}

const getSupabaseConfig = () => {
  const url = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  return { url, key };
};

/** Appel direct à l'Edge Function pour pouvoir lire le corps d'erreur (message réel) en cas de non-2xx */
export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<CreateCheckoutResult> {
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
        apikey: key,
      },
      body: JSON.stringify(params),
    });
    const data = (await res.json().catch(() => ({}))) as {
      url?: string;
      sessionId?: string;
      error?: string;
      details?: string;
      message?: string;
    };
    if (res.ok) {
      if (data?.url) {
        return { url: data.url, ...(data.sessionId ? { sessionId: data.sessionId } : {}) };
      }
      return { error: data?.error || data?.details || "La fonction n'a pas renvoyé de lien." };
    }

    console.error('[createCheckoutSession] échec', {
      status: res.status,
      body: data,
    });

    const friendly = userMessageForCheckoutFailure(
      res.status,
      data as { error?: string; details?: string; message?: string; code?: string }
    );
    return { error: friendly };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[createCheckoutSession] exception', err);
    if (message === 'Failed to fetch') {
      return {
        error: 'Connexion instable. Vérifiez le réseau et réessayez.',
      };
    }
    return { error: MSG_CHECKOUT_GENERIC };
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
        apikey: key,
      },
      body: JSON.stringify(params),
    });
    const data = (await res.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
      details?: string;
      message?: string;
    };
    if (res.ok) {
      if (data?.url) return { url: data.url };
      return { error: data?.error || data?.details || "La fonction n'a pas renvoyé de lien." };
    }
    const msg = data?.error || data?.details || data?.message || `Erreur ${res.status}`;
    return { error: msg };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === 'Failed to fetch') {
      return { error: 'Connexion instable. Vérifiez le réseau et réessayez.' };
    }
    return {
      error:
        'Impossible d’ouvrir la page de paiement pour le moment. Réessayez dans quelques minutes.',
    };
  }
}

interface CreateSubscriptionParams {
  studioId: string;
  email: string;
  plan: 'solo' | 'pro' | 'studio';
  interval: 'monthly' | 'annual';
}

export type CreateSubscriptionResult = { url: string } | { error: string };

/** Crée une session Checkout Stripe pour l'abonnement InkFlow (JWT requis). */
export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<CreateSubscriptionResult> {
  try {
    const { url: baseUrl, key } = getSupabaseConfig();
    if (!baseUrl || !key) {
      return { error: 'Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).' };
    }
    const token = await resolveAccessTokenForEdgeFn();
    if (!token) {
      return { error: 'Session expirée : reconnecte-toi pour souscrire à un plan.' };
    }
    const fnUrl = `${baseUrl.replace(/\/$/, '')}/functions/v1/create-subscription`;
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: key,
      },
      body: JSON.stringify(params),
    });
    const data = (await res.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
      details?: string;
    };
    if (res.ok && data?.url) {
      return { url: data.url };
    }
    const raw = (data.error || data.details || '').trim();
    if (res.status === 401) {
      return {
        error: 'Session expirée : reconnecte-toi puis réessaie depuis Paramètres > Facturation.',
      };
    }
    if (res.status === 403 && raw) {
      return { error: raw.length > 280 ? `${raw.slice(0, 277)}…` : raw };
    }
    if (res.status === 404 && raw) {
      return { error: raw.length > 280 ? `${raw.slice(0, 277)}…` : raw };
    }
    if (raw && !looksLikeTechnicalError(raw)) {
      return { error: raw.length > 280 ? `${raw.slice(0, 277)}…` : raw };
    }
    return {
      error:
        'Impossible d’ouvrir la page de paiement pour l’instant. Réessaie depuis Paramètres > Facturation ou vérifie ta connexion.',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === 'Failed to fetch') {
      return { error: 'Connexion instable. Vérifie le réseau et réessaie.' };
    }
    return {
      error: 'Impossible de créer la session de paiement. Réessaie dans quelques instants.',
    };
  }
}

export type CreatePortalSessionResult = { url: string } | { error: string };

export type StripeConnectOnboardingResult = { url: string } | { error: string };

/** Message utilisateur pour erreurs type JWT / passerelle (évite d’imposer une double déconnexion à tort). */
const STRIPE_CONNECT_SESSION_COPY =
  'Problème d’authentification avec le serveur. Rechargez la page (F5), puis réessayez « Connecter mon compte Stripe ».';

/**
 * Remplace les erreurs brutes GoTrue / passerelle (souvent en anglais) par un libellé lisible en français.
 */
function humanizeStripeConnectError(raw: string): string {
  const s = raw.trim();
  if (!s) return raw;
  const lower = s.replace(/\s+/g, ' ').toLowerCase();

  const jwtNoise =
    lower === 'invalid jwt' ||
    /\binvalid\s+jwt\b/.test(lower) ||
    /\bjwt\s+(has\s+)?expired\b/.test(lower) ||
    /\bjwt\s+malformed\b/.test(lower) ||
    (/\bjwt\b/.test(lower) && /\b(invalid|expired|malformed|revoked)\b/.test(lower)) ||
    (/\baccess[_\s]?token\b/.test(lower) && /\b(invalid|expired)\b/.test(lower)) ||
    /\btoken\s+(has\s+)?expired\b/.test(lower) ||
    lower.includes('invalid_grant') ||
    (lower.includes('refresh') && lower.includes('token') && lower.includes('invalid'));

  if (jwtNoise) {
    return STRIPE_CONNECT_SESSION_COPY;
  }

  if (lower === 'unauthorized' || lower === 'not authorized' || lower === 'permission denied') {
    return 'Authentification refusée. Reconnectez-vous puis réessayez.';
  }

  return s;
}

/** Préfère toujours le jeton renvoyé par `refreshSession()` (évite 401 si le stockage local est légèrement désynchronisé). */
async function getFreshAccessTokenForEdgeFn(): Promise<string | null> {
  const { data: ref, error: refErr } = await supabase.auth.refreshSession();
  if (!refErr && ref.session?.access_token) {
    return ref.session.access_token;
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/** Token utilisable pour les Edge Functions (rafraîchit si proche de l’expiration). */
async function resolveAccessTokenForEdgeFn(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const soon = session?.expires_at != null && session.expires_at * 1000 < Date.now() + 120_000;
  if (!session?.access_token || soon) {
    return getFreshAccessTokenForEdgeFn();
  }
  return session?.access_token ?? null;
}

/** Ne pas traiter tout 403 comme JWT (ex. « Accès refusé à ce studio »). */
function isJwtFailureStatus(status: number, rawMessage: string | null): boolean {
  if (status === 401) return true;
  if (!rawMessage) return false;
  const l = rawMessage.toLowerCase();
  return l.includes('invalid jwt') || l.includes('jwt expired');
}

/**
 * Appel direct à l’Edge Function (fetch + JWT + apikey) — même en-têtes que les autres flux Edge ; message d’erreur JSON lisible.
 */
async function stripeConnectOnboardingViaFetch(
  studioId: string,
  baseUrl: string,
  key: string,
  fail: (msg: string) => StripeConnectOnboardingResult,
  /** Jeton déjà obtenu dans `startStripeConnectOnboarding` (évite double refresh + incohérences). */
  seedAccessToken?: string | null
): Promise<StripeConnectOnboardingResult> {
  let accessToken = seedAccessToken ?? (await resolveAccessTokenForEdgeFn());
  if (!accessToken) {
    return fail(
      'Session expirée ou absente. Reconnectez-vous puis réessayez « Connecter mon compte Stripe ».'
    );
  }

  const fnUrl = `${baseUrl.replace(/\/$/, '')}/functions/v1/stripe-connect-onboarding`;

  for (let attempt = 0; attempt < 2; attempt++) {
    let res: Response;
    try {
      res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: key,
        },
        body: JSON.stringify({ studioId }),
      });
    } catch {
      return fail('Réseau indisponible. Vérifiez votre connexion et réessayez.');
    }

    let text: string;
    try {
      text = await res.text();
    } catch {
      return fail(`Réponse serveur illisible (${res.status}). Réessayez plus tard.`);
    }

    let parsed: { url?: string; error?: string; details?: string } = {};
    try {
      if (text) parsed = JSON.parse(text) as typeof parsed;
    } catch {
      /* corps non JSON */
    }

    if (res.ok && typeof parsed.url === 'string' && parsed.url) {
      return { url: parsed.url };
    }

    const bizMsg = (parsed.error || parsed.details || '').trim();
    if (attempt === 0 && isJwtFailureStatus(res.status, bizMsg || null)) {
      await supabase.auth.refreshSession().catch(() => {});
      const next = await resolveAccessTokenForEdgeFn();
      if (!next) {
        return fail(STRIPE_CONNECT_SESSION_COPY);
      }
      accessToken = next;
      continue;
    }

    if (bizMsg) {
      return fail(bizMsg.length > 500 ? `${bizMsg.slice(0, 500)}…` : bizMsg);
    }

    if (!res.ok) {
      if (res.status === 401) {
        return fail(
          'Connexion refusée (401). Déconnecte-toi puis reconnecte-toi. Si ça continue : redéploie l’Edge Function « stripe-connect-onboarding » avec verify_jwt désactivé (npm run deploy:function:stripe-connect-onboarding ou supabase/config.toml), puis réessaie.'
        );
      }
      return fail(
        `Connexion Stripe impossible (erreur ${res.status}). Vérifiez que l’Edge Function stripe-connect-onboarding est déployée, puis rechargez la page.`
      );
    }

    return fail(
      'Aucun lien Stripe reçu. Vérifiez que l’Edge Function stripe-connect-onboarding est déployée sur votre projet Supabase.'
    );
  }

  return fail(STRIPE_CONNECT_SESSION_COPY);
}

/**
 * Ouvre l’onboarding Stripe Connect (Express).
 * Un seul chemin `fetch` (JWT + apikey explicites) pour éviter les doubles appels et les 401 bruyants ;
 * vérifie que le JWT correspond au projet `VITE_SUPABASE_URL` (sinon déconnexion / .env incohérent).
 *
 * L’id studio envoyé par l’UI peut diverger de la BDD (nouveau compte, renommage) : on résout toujours
 * l’id réel via `getStudioByEmail` pour éviter « Studio introuvable » côté Edge Function.
 */
export async function startStripeConnectOnboarding(
  studioId: string
): Promise<StripeConnectOnboardingResult> {
  const { url: baseUrl, key } = getSupabaseConfig();
  if (!baseUrl || !key) return { error: 'Supabase non configuré.' };

  const fail = (msg: string): StripeConnectOnboardingResult => ({
    error: humanizeStripeConnectError(msg),
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user?.email?.trim()) {
    return fail(
      'Session expirée ou absente. Reconnectez-vous puis réessayez « Connecter mon compte Stripe ».'
    );
  }

  const accessToken = await getFreshAccessTokenForEdgeFn();
  if (!accessToken) {
    return fail(
      'Session expirée ou absente. Reconnectez-vous puis réessayez « Connecter mon compte Stripe ».'
    );
  }

  if (!isAccessTokenForCurrentSupabaseProject(accessToken)) {
    return fail(
      'Ta session correspond à un autre projet Supabase que celui configuré dans cette app (fichier .env). Déconnecte-toi, vérifie VITE_SUPABASE_URL, puis reconnecte-toi.'
    );
  }

  const email = userData.user.email.trim();
  let studioRow = await getStudioByEmail(email);
  if (!studioRow?.id) {
    const meta = userData.user.user_metadata ?? {};
    const name = (
      typeof meta.name === 'string' && meta.name.trim()
        ? meta.name
        : typeof meta.full_name === 'string' && meta.full_name.trim()
          ? meta.full_name
          : email.split('@')[0] || 'Utilisateur'
    ) as string;
    const studioName = (
      typeof meta.studio_name === 'string' && meta.studio_name.trim()
        ? meta.studio_name
        : 'Mon studio'
    ) as string;
    try {
      await ensureStudio(email, name, studioName);
    } catch {
      return fail(
        'Espace studio introuvable : recharge la page (F5), attends quelques secondes, puis réessaie « Connecter mon compte Stripe ».'
      );
    }
    studioRow = await getStudioByEmail(email);
  }
  if (!studioRow?.id) {
    return fail(
      'Studio introuvable : ouvre le tableau de bord une première fois pour enregistrer ton espace, recharge la page, puis réessaie « Connecter mon compte Stripe ».'
    );
  }

  if (studioId && studioId !== studioRow.id) {
    if (import.meta.env.DEV) {
      console.warn('[startStripeConnectOnboarding] studioId UI ≠ BDD, utilisation de l’id BDD', {
        fromUi: studioId,
        resolved: studioRow.id,
      });
    }
  }

  return stripeConnectOnboardingViaFetch(studioRow.id, baseUrl, key, fail, accessToken);
}

/** Crée une session du Customer Portal Stripe pour gérer l'abonnement (facture, paiement, annulation). */
export async function createPortalSession(params: {
  studioId?: string;
  email?: string;
}): Promise<CreatePortalSessionResult> {
  const { url: baseUrl, key } = getSupabaseConfig();
  if (!baseUrl || !key) return { error: 'Supabase non configuré.' };

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      return { error: 'Session expirée : reconnecte-toi pour gérer la facturation.' };
    }

    const fnUrl = `${baseUrl.replace(/\/$/, '')}/functions/v1/create-portal-session`;

    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: key,
      },
      body: JSON.stringify(params),
    });

    const data = (await res.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
      details?: string;
      message?: string;
    };

    if (res.ok && data?.url) return { url: data.url };

    const msg = data?.error || data?.details || data?.message || `Erreur ${res.status}`;
    return { error: msg };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error:
        message === 'Failed to fetch'
          ? "Impossible de contacter le serveur. Vérifiez votre connexion et que l'Edge Function create-portal-session est déployée."
          : message,
    };
  }
}

export type StripeConnectActionsResult =
  | {
      ok: true;
      stripe_connect_charges_enabled?: boolean;
      stripe_connect_details_submitted?: boolean;
    }
  | { error: string };

export type StripeExpressLoginResult = { url: string } | { error: string };

export type StripeConnectDisconnectResult = { ok: true } | { error: string };

async function callStripeConnectActions(
  body: Record<string, unknown>
): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const { url: baseUrl, key } = getSupabaseConfig();
  if (!baseUrl || !key) {
    return { ok: false, data: { error: 'Supabase non configuré.' } };
  }
  const accessToken = await getFreshAccessTokenForEdgeFn();
  if (!accessToken) {
    return { ok: false, data: { error: STRIPE_CONNECT_SESSION_COPY } };
  }
  const fnUrl = `${baseUrl.replace(/\/$/, '')}/functions/v1/stripe-connect-actions`;
  try {
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: key,
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, data };
  } catch {
    return {
      ok: false,
      data: {
        error:
          'Connexion instable. Vérifiez le réseau, rechargez la page si besoin, puis réessayez.',
      },
    };
  }
}

/** Met à jour charges_enabled / details_submitted depuis l’API Stripe (webhook parfois en retard). */
export async function syncStripeConnectStatus(
  studioId: string
): Promise<StripeConnectActionsResult> {
  const { ok, data } = await callStripeConnectActions({ action: 'sync', studioId });
  if (ok && data.ok === true) {
    return {
      ok: true,
      stripe_connect_charges_enabled: data.stripe_connect_charges_enabled as boolean | undefined,
      stripe_connect_details_submitted: data.stripe_connect_details_submitted as
        | boolean
        | undefined,
    };
  }
  const err = typeof data.error === 'string' ? data.error : 'Synchronisation impossible';
  return { error: humanizeStripeConnectError(err) };
}

/** Lien à usage unique vers le tableau de bord Express (compte connecté). */
export async function createStripeExpressLoginLink(
  studioId: string
): Promise<StripeExpressLoginResult> {
  const { ok, data } = await callStripeConnectActions({ action: 'express_login', studioId });
  if (ok && typeof data.url === 'string' && data.url.startsWith('http')) {
    return { url: data.url };
  }
  const err = typeof data.error === 'string' ? data.error : 'Lien Stripe indisponible';
  return { error: humanizeStripeConnectError(err) };
}

/** Retire la liaison InkFlow ↔ compte Connect (les paiements en ligne s’arrêtent jusqu’à une nouvelle connexion). */
export async function disconnectStripeConnect(
  studioId: string
): Promise<StripeConnectDisconnectResult> {
  const { ok, data } = await callStripeConnectActions({ action: 'disconnect', studioId });
  if (ok && data.disconnected === true) {
    return { ok: true };
  }
  const err = typeof data.error === 'string' ? data.error : 'Déliaison impossible';
  return { error: humanizeStripeConnectError(err) };
}
