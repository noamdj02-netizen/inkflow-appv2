import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Cookie } from 'lucide-react';
import {
  INKFLOW_COOKIE_CONSENT_KEY,
  INKFLOW_OPEN_COOKIE_SETTINGS_EVENT,
  INKFLOW_COOKIE_CONSENT_CHANGED_EVENT,
  type CookieConsentValue,
} from '../lib/cookieConsentStorage';
import { APP_COOKIES_PATH, APP_PRIVACY_PATH } from '../lib/urls';

export type { CookieConsentValue };

export const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showIfNeeded = useCallback(() => {
    try {
      const stored = localStorage.getItem(INKFLOW_COOKIE_CONSENT_KEY);
      if (!stored) {
        const t = setTimeout(() => setVisible(true), 2000);
        return () => clearTimeout(t);
      }
    } catch {
      const t = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (!mounted) return;
    return showIfNeeded();
  }, [mounted, showIfNeeded]);

  useEffect(() => {
    if (!mounted) return;
    const openSettings = () => setVisible(true);
    window.addEventListener(INKFLOW_OPEN_COOKIE_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(INKFLOW_OPEN_COOKIE_SETTINGS_EVENT, openSettings);
  }, [mounted]);

  const saveAndHide = (value: CookieConsentValue) => {
    try {
      localStorage.setItem(INKFLOW_COOKIE_CONSENT_KEY, value);
      setVisible(false);
      try {
        window.dispatchEvent(new Event(INKFLOW_COOKIE_CONSENT_CHANGED_EVENT));
      } catch {
        /* ignore */
      }
    } catch {
      setVisible(false);
    }
  };

  if (!visible || !mounted || typeof document === 'undefined') return null;

  const content = (
    <div
      role="dialog"
      aria-label="Consentement aux cookies"
      aria-modal="true"
      className="fixed inset-x-0 bottom-0 z-[99999] p-3 pb-safe sm:p-4 md:inset-x-auto md:left-4 md:right-auto md:bottom-4 md:max-w-md"
    >
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/10">
        <div className="flex items-start gap-3 border-b border-zinc-100 bg-zinc-50/80 px-4 py-3 sm:px-5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-white">
            <Cookie className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Cookies & confidentialité</p>
            <p className="text-xs text-zinc-500">InkFlow respecte votre choix (RGPD).</p>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <p className="mb-4 text-sm leading-relaxed text-zinc-600">
            Nous utilisons des cookies essentiels (session, préférences). Avec votre accord, nous
            chargeons aussi des statistiques anonymes (Vercel Analytics, PostHog si activé). Pas de
            publicité ciblée.{' '}
            <a
              href={APP_COOKIES_PATH}
              className="font-medium text-zinc-700 underline-offset-2 hover:underline hover:text-zinc-900"
            >
              Politique cookies
            </a>{' '}
            ·{' '}
            <a
              href={APP_PRIVACY_PATH}
              className="font-medium text-zinc-700 underline-offset-2 hover:underline hover:text-zinc-900"
            >
              Confidentialité
            </a>
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <button
              type="button"
              onClick={() => saveAndHide('all')}
              className="active:scale-[0.98] rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800"
            >
              Accepter tout
            </button>
            <button
              type="button"
              onClick={() => saveAndHide('essential')}
              className="active:scale-[0.98] rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-all hover:bg-zinc-50"
            >
              Essentiels uniquement
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
