/**
 * Sentry — initialisation au chargement de l'app.
 * DSN : VITE_SENTRY_DSN (optionnel, désactivé si absent).
 */
import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;
if (dsn && typeof dsn === 'string' && dsn.startsWith('https://')) {
  Sentry.init({
    dsn,
    sendDefaultPii: true,
    enableLogs: true,
    /** Évite le bruit Sentry quand Vite HMR casse temporairement l’arbre des providers (dev uniquement). */
    beforeSend(event, hint) {
      if (import.meta.env.DEV) {
        const ex = hint.originalException;
        const msg = ex instanceof Error ? ex.message : typeof ex === 'string' ? ex : '';
        if (
          msg.includes('must be used within an AuthProvider') ||
          msg.includes('must be used within SupabaseSyncProvider') ||
          msg.includes('must be used within ToastProvider') ||
          msg.includes('Should have a queue') ||
          msg.includes('Rendered more hooks')
        ) {
          return null;
        }
      }
      return event;
    },
    /** Réduit le bruit : extensions navigateur, rejets non-Error souvent capturés en double. */
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
    ],
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    environment: import.meta.env.MODE,
  });
}
