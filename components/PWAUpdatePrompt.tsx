import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Enregistre le SW PWA (`registerType: 'autoUpdate'`).
 * Nouvelle build détectée → skipWaiting + reload automatique (sans bannière « Recharger »).
 */
export const PWAUpdatePrompt: React.FC = () => {
  useRegisterSW({ onOfflineReady: () => {} });
  return null;
};
