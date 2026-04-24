/** Clé **publique** Cloudflare Turnstile (Vite). Secret `TURNSTILE_SECRET_KEY` côté Edge uniquement. */
const raw = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) || '';

export const TURNSTILE_SITE_KEY = typeof raw === 'string' ? raw.trim() : '';

export function isTurnstileEnabled(): boolean {
  return TURNSTILE_SITE_KEY.length > 10;
}
