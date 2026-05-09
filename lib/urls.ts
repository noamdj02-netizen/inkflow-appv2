/**
 * URLs centralisées pour la navigation entre la landing (Framer) et l'app.
 * Landing : https://ink-flow.me (Framer)
 * App : https://app.ink-flow.me ou inkdlow.vercel.app
 *
 * Espace client (`/client/dashboard`, requêtes `?tab=`) : chemins et onglets dans
 * `lib/clientDashboardRoutes.ts` — `pathForClientDashboardTab`, `PATH_CLIENT_DASHBOARD`.
 * Pour les URLs **absolues** (e-mail, liens, OAuth) : `getCanonicalAppOrigin()` et `APP_URL` ci-dessous.
 */

import { CLIENT_ACCOUNT_HUB_PATH } from './clientOnboardingGate';

export const LANDING_URL = 'https://ink-flow.me';
export const APP_URL = 'https://app.ink-flow.me';

/** Hostnames de la landing marketing (Framer) — ne jamais les utiliser comme redirectTo Supabase. */
const LANDING_HOSTNAMES = new Set(['ink-flow.me', 'www.ink-flow.me']);

/**
 * Origine pour les redirections auth (lien magique, OAuth, reset mdp).
 * Si la SPA est ouverte par erreur sur la landing, on force l’URL de l’app.
 */
export function getCanonicalAppOrigin(): string {
  if (typeof window === 'undefined') return APP_URL;
  const { origin, hostname } = window.location;
  if (LANDING_HOSTNAMES.has(hostname.toLowerCase())) {
    return APP_URL;
  }
  return origin;
}

/**
 * Chemin hub client relatif (navigation SPA + `redirect_to` auth).
 * `studio` : contexte vitrine / e-mail (questionnaire, retour après login).
 */
export function getClientAccountHubPath(opts?: { studioSlug?: string | null }): string {
  const slug = opts?.studioSlug?.trim();
  if (!slug) return CLIENT_ACCOUNT_HUB_PATH;
  return `${CLIENT_ACCOUNT_HUB_PATH}?studio=${encodeURIComponent(slug)}`;
}

/** URL absolue hub client (e-mails, partage) — origine canonique appli. */
export function buildClientAccountHubUrl(opts?: { studioSlug?: string | null }): string {
  const origin = getCanonicalAppOrigin().replace(/\/+$/, '');
  return `${origin}${getClientAccountHubPath(opts)}`;
}

/** redirectTo pour le magic link et la confirmation e-mail client → callback puis hub `/mon-compte`. */
export function getClientMagicLinkRedirectTo(opts?: { studioSlug?: string | null }): string {
  const hubPath = getClientAccountHubPath({ studioSlug: opts?.studioSlug });
  const q = new URLSearchParams({
    redirect_to: hubPath,
  });
  return `${getCanonicalAppOrigin()}/auth/callback/client?${q.toString()}`;
}

/** Même cible que le magic link (inscription e-mail avec confirmation). */
export function getClientEmailConfirmRedirectTo(opts?: { studioSlug?: string | null }): string {
  return getClientMagicLinkRedirectTo(opts);
}

/** `redirectTo` OAuth (Google) depuis `/client` — même callback que le magic link. */
export function getClientPortalOAuthRedirectTo(opts?: { studioSlug?: string | null }): string {
  return getClientMagicLinkRedirectTo(opts);
}

/** redirectTo pour OAuth tatoueur (`/auth/callback`). */
export function getAuthCallbackRedirectTo(): string {
  return `${getCanonicalAppOrigin()}/auth/callback`;
}

/** redirectTo pour resetPasswordForEmail — doit être l’app (app.ink-flow.me), pas la landing Framer. */
export function getPasswordRecoveryRedirectTo(): string {
  return `${getCanonicalAppOrigin()}/reset-password`;
}

/**
 * Chemin interne après inscription (tunnel pricing ?plan= / ?interval=).
 */
export function getPostSignupDashboardPath(search: string): string {
  const params = new URLSearchParams(search);
  const plan = params.get('plan');
  const interval = params.get('interval') || 'monthly';
  const paidPlans = ['solo', 'studio', 'starter', 'pro'];
  if (plan && paidPlans.includes(plan)) {
    return `/dashboard?subscribe=${encodeURIComponent(plan)}&interval=${encodeURIComponent(interval)}`;
  }
  return '/dashboard';
}

/**
 * Après auth (callback, sessionStorage, query), n'accepte que des chemins internes ou l'origine de l'app.
 * Rejette la landing Framer et les URLs externes (open redirect).
 */
export function sanitizePostAuthRedirect(
  raw: string | null | undefined,
  options?: { defaultPath?: string }
): string {
  const fallback = options?.defaultPath ?? '/dashboard';
  if (raw == null || !String(raw).trim()) return fallback;
  const t = String(raw).trim();
  if (t.startsWith('/')) {
    if (t.startsWith('//') || t.toLowerCase().startsWith('/\\')) return fallback;
    const noHash = t.split('#')[0] ?? t;
    return noHash || fallback;
  }
  try {
    const u = new URL(t);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return fallback;
    if (LANDING_HOSTNAMES.has(u.hostname.toLowerCase())) return fallback;
    const here = typeof window !== 'undefined' ? window.location.origin : APP_URL;
    if (u.origin === here.replace(/\/+$/, '')) {
      return `${u.pathname}${u.search}`;
    }
    const host = u.hostname.toLowerCase();
    if (host === 'app.ink-flow.me' || host === 'localhost' || host === '127.0.0.1') {
      return `${u.pathname}${u.search}`;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Origine publique pour les liens /invite (parrainage).
 * En local, `window.location.origin` vaut localhost — les amis ne peuvent pas ouvrir le lien.
 * Définir `VITE_PUBLIC_INVITE_ORIGIN=https://app.ink-flow.me` (ou ton domaine Vercel) dans .env.local et Vercel.
 */
export function getInviteShareOrigin(): string {
  const fromEnv =
    (import.meta.env.VITE_PUBLIC_INVITE_ORIGIN as string | undefined)?.trim() ||
    (import.meta.env.VITE_APP_URL as string | undefined)?.trim();
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) {
    try {
      return new URL(fromEnv).origin.replace(/\/$/, '');
    } catch {
      /* ignore */
    }
  }
  if (typeof window !== 'undefined') return window.location.origin.replace(/\/$/, '');
  return APP_URL.replace(/\/$/, '');
}

/** Base path des invitations : `https://app…/invite` */
export const getInviteBaseUrl = () => `${getInviteShareOrigin()}/invite`;

/**
 * URL publique canonique pour partager la vitrine d'un studio.
 * - En local (`localhost`) → on renvoie quand même `https://app.ink-flow.me/studio/<slug>`
 *   pour que le lien partagé fonctionne en production.
 * - Sur la landing Framer (`ink-flow.me`) → force `app.ink-flow.me`.
 * - Sur l'app (app.ink-flow.me / vercel preview) → utilise l'origine courante.
 */
export function getVitrineShareUrl(slug: string): string {
  const safeSlug = encodeURIComponent(String(slug ?? '').trim());
  // Priorité à l'env explicite (utile en dev local pour forcer le domaine public).
  const fromEnv =
    (import.meta.env.VITE_APP_URL as string | undefined)?.trim() ||
    (import.meta.env.VITE_PUBLIC_INVITE_ORIGIN as string | undefined)?.trim();
  let origin: string;
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) {
    try {
      origin = new URL(fromEnv).origin.replace(/\/$/, '');
    } catch {
      origin = getCanonicalAppOrigin();
    }
  } else if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    // En local (ou IP) : on renvoie le domaine prod pour que le lien partagé fonctionne hors de la machine.
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
      origin = APP_URL.replace(/\/$/, '');
    } else {
      origin = getCanonicalAppOrigin().replace(/\/$/, '');
    }
  } else {
    origin = APP_URL.replace(/\/$/, '');
  }
  return `${origin}/studio/${safeSlug}`;
}
export const LANDING_PRICING_URL = `${LANDING_URL}/#pricing`;
/** Pages légales sur la landing Framer */
export const LANDING_PRIVACY_URL = `${LANDING_URL}/politique-confidentialite`;
export const LANDING_TERMS_URL = `${LANDING_URL}/conditions-utilisation`;
export const LANDING_LEGAL_URL = `${LANDING_URL}/mentions-legales`;

/** Compte Instagram officiel InkFlow (lien partage / footer). */
export const INKFLOW_INSTAGRAM_URL =
  'https://www.instagram.com/inkflowme?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==';

/**
 * Normalise une URL saisie (sans schéma → https://) et ne retourne que http(s).
 * Rejette javascript:, data:, etc.
 */
export function safeExternalHttpUrl(raw: string | undefined | null): string | null {
  const t = (raw ?? '').trim();
  if (!t) return null;
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.href;
  } catch {
    return null;
  }
}
