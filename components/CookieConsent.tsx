import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const STORAGE_KEY = 'inkflow_cookie_consent';

export type CookieConsentValue = 'all' | 'essential';

export const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, [mounted]);

  const saveAndHide = (value: CookieConsentValue) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
      setVisible(false);
    } catch {
      setVisible(false);
    }
  };

  if (!visible || !mounted || typeof document === 'undefined') return null;

  const content = (
    <div
      role="dialog"
      aria-label="Consentement aux cookies"
      className="fixed bottom-0 left-0 right-0 z-[99999] p-4 pb-safe sm:p-5 md:left-4 md:right-auto md:bottom-4 md:max-w-md md:rounded-2xl md:shadow-xl bg-white/95 dark:bg-[var(--bg-primary)]/95 backdrop-blur-sm md:bg-transparent md:dark:bg-transparent"
    >
      <div className="bg-white dark:bg-[var(--bg-secondary)] border border-neutral-200 dark:border-neutral-700/60 rounded-xl md:rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 sm:p-5">
          <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-4">
            Nous utilisons des cookies pour améliorer votre expérience, analyser notre trafic et sécuriser l&apos;application.{' '}
            <a
              href="/privacy-policy"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-[var(--bg-primary)] rounded"
            >
              En savoir plus
            </a>
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => saveAndHide('all')}
              className="px-4 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:focus:ring-offset-[var(--bg-primary)] transition-opacity"
            >
              Accepter tout
            </button>
            <button
              type="button"
              onClick={() => saveAndHide('essential')}
              className="px-4 py-2.5 border-2 border-[var(--border)] dark:border-neutral-600 rounded-xl font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-[var(--bg-primary)] transition-colors"
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
