import * as Sentry from '@sentry/react';

/**
 * Bouton de test Sentry — affiché uniquement en `npm run dev`.
 * Envoie une exception capturée sans faire planter l’arbre React (évite l’écran ErrorBoundary).
 */
export function SentryTestButton() {
  if (!import.meta.env.DEV) return null;

  return (
    <button
      type="button"
      className="fixed bottom-4 left-4 z-[9998] rounded-xl border border-zinc-600 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-300 shadow-sm backdrop-blur-sm transition-all hover:bg-zinc-800 active:scale-[0.98]"
      onClick={() => {
        Sentry.captureException(new Error('Test Sentry — premier incident (dev)'));
      }}
    >
      Tester Sentry
    </button>
  );
}
