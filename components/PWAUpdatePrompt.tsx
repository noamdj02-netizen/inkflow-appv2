import React, { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';

export const PWAUpdatePrompt: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    registerSW({
      onNeedRefresh() {
        // Nouveau SW disponible — applique immédiatement, controllerchange recharge la page
        window.location.reload();
      },
      onOfflineReady() {},
    });
  }, []);

  return null;
};
