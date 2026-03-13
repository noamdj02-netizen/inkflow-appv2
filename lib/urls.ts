/**
 * URLs centralisées pour la navigation entre la landing (Framer) et l'app.
 * Landing : https://ink-flow.me (Framer)
 * App : https://app.ink-flow.me ou inkdlow.vercel.app
 */

export const LANDING_URL = 'https://ink-flow.me';
export const APP_URL = 'https://app.ink-flow.me';
/** Base URL pour les liens de parrainage /invite/:code — utilise l'origine courante en prod */
export const getInviteBaseUrl = () =>
  (typeof window !== 'undefined' ? window.location.origin : APP_URL) + '/invite';
export const LANDING_PRICING_URL = `${LANDING_URL}/#pricing`;
/** Pages légales sur la landing Framer */
export const LANDING_PRIVACY_URL = `${LANDING_URL}/politique-confidentialite`;
export const LANDING_TERMS_URL = `${LANDING_URL}/conditions-utilisation`;
export const LANDING_LEGAL_URL = `${LANDING_URL}/mentions-legales`;
