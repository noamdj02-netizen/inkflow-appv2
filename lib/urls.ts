/**
 * URLs centralisées pour la navigation entre la landing (Framer) et l'app.
 * Landing : https://ink-flow.me (Framer)
 * App : https://app.ink-flow.me ou inkdlow.vercel.app
 */

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

/** redirectTo pour le magic link espace client (`/client`). */
export function getClientMagicLinkRedirectTo(): string {
  return `${getCanonicalAppOrigin()}/client`;
}

/** redirectTo pour OAuth tatoueur (`/auth/callback`). */
export function getAuthCallbackRedirectTo(): string {
  return `${getCanonicalAppOrigin()}/auth/callback`;
}

/** redirectTo pour réinitialisation du mot de passe. */
export function getPasswordRecoveryRedirectTo(): string {
  return `${getCanonicalAppOrigin()}/auth/update-password`;
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
export const LANDING_PRICING_URL = `${LANDING_URL}/#pricing`;
/** Pages légales sur la landing Framer */
export const LANDING_PRIVACY_URL = `${LANDING_URL}/politique-confidentialite`;
export const LANDING_TERMS_URL = `${LANDING_URL}/conditions-utilisation`;
export const LANDING_LEGAL_URL = `${LANDING_URL}/mentions-legales`;

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

