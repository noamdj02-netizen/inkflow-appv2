import posthog from 'posthog-js';

let initialized = false;

export function initPosthogAfterConsent(): void {
  if (initialized) return;
  if (typeof window === 'undefined') return;
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key || String(key).trim() === '') return;

  const apiHost =
    (import.meta.env.VITE_POSTHOG_HOST as string | undefined)?.trim() || 'https://eu.i.posthog.com';

  posthog.init(key, {
    api_host: apiHost,
    ui_host: 'https://eu.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: 'history_change',
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-private],[data-sensitive]',
    },
  });

  initialized = true;
}

export function isPosthogInitialized(): boolean {
  return initialized;
}

export function resetPosthogIdentity(): void {
  if (!initialized) return;
  try {
    posthog.reset();
  } catch {
    /* ignore */
  }
}

export { posthog };
