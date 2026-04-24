/** Même clé / valeurs que `components/CookieConsent.tsx` (évite import circulaire). */
export const INKFLOW_COOKIE_CONSENT_KEY = 'inkflow_cookie_consent';

export type CookieConsentValue = 'all' | 'essential';

export function readCookieConsent(): CookieConsentValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(INKFLOW_COOKIE_CONSENT_KEY);
    if (v === 'all' || v === 'essential') return v;
  } catch {
    /* quota / private */
  }
  return null;
}
