import React, { useState, useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';

/**
 * Bannière "Nouvelle version disponible" quand le Service Worker détecte une mise à jour.
 * Évite les erreurs fetch pendant les déploiements.
 */
export const PWAUpdatePrompt: React.FC = () => {
  const [show, setShow] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const doUpdate = registerSW({
      onNeedRefresh: () => {
        setUpdateSW(() => doUpdate);
        setShow(true);
      },
      onOfflineReady: () => {},
    });
  }, []);

  if (!show) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-[99998] p-4 rounded-xl bg-neutral-900 text-white shadow-xl border border-neutral-700"
    >
      <p className="text-sm font-medium mb-3">Nouvelle version disponible</p>
      <p className="text-xs text-neutral-300 mb-4">Rechargez la page pour profiter des dernières mises à jour.</p>
      <div className="flex gap-2">
        <button
          onClick={() => {
            updateSW?.();
            setShow(false);
          }}
          className="flex-1 py-2 px-4 bg-white text-neutral-900 rounded-lg font-semibold text-sm hover:bg-neutral-100 transition-colors"
        >
          Recharger
        </button>
        <button
          onClick={() => setShow(false)}
          className="py-2 px-4 border border-neutral-600 rounded-lg text-sm hover:bg-neutral-800 transition-colors"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
};
