import React, { useEffect, useState } from 'react';
import { INKFLOW_COOKIE_CONSENT_KEY, type CookieConsentValue } from '../lib/cookieConsentStorage';
import { initPosthogAfterConsent } from '../lib/analytics/posthogInit';

/**
 * PostHog (produit, funnels, session replay) — seulement si « Accepter tout » + VITE_POSTHOG_KEY.
 * Hébergement EU par défaut (voir .env.example).
 */
export const PostHogOptIn: React.FC = () => {
  const [value, setValue] = useState<CookieConsentValue | 'unset' | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const v = localStorage.getItem(INKFLOW_COOKIE_CONSENT_KEY);
      if (v === 'all' || v === 'essential') return v;
      if (v == null) return 'unset';
    } catch {
      return 'unset';
    }
    return 'unset';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== INKFLOW_COOKIE_CONSENT_KEY) return;
      if (e.newValue === 'all' || e.newValue === 'essential') {
        setValue(e.newValue);
      } else {
        setValue(e.newValue == null ? 'unset' : null);
      }
    };
    const onLocal = () => {
      try {
        const v = localStorage.getItem(INKFLOW_COOKIE_CONSENT_KEY);
        if (v === 'all' || v === 'essential') setValue(v);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('inkflow-cookie-consent', onLocal);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('inkflow-cookie-consent', onLocal);
    };
  }, []);

  useEffect(() => {
    if (value === 'all') {
      initPosthogAfterConsent();
    }
  }, [value]);

  return null;
};
