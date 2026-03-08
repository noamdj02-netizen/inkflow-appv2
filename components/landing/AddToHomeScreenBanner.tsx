'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, X } from 'lucide-react';

/** Événement non standard : invite d’installation PWA (Chrome/Android). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'inkflow-install-banner';
const DISMISS_DAYS = 7;

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    (window as unknown as { matchMedia?: (q: string) => { matches: boolean } }).matchMedia?.('(display-mode: standalone)')?.matches === true
  );
}

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const { at } = JSON.parse(raw) as { at?: number };
    if (!at) return false;
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function setDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ at: Date.now() }));
  } catch {
    //
  }
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export const AddToHomeScreenBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStandalone()) return;
    if (wasDismissedRecently()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    // Afficher à l’arrivée sur la landing (Android: prompt natif possible, iOS: instructions manuelles)
    setVisible(true);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt?.prompt) {
      try {
        const { outcome } = await deferredPrompt.prompt();
        if (outcome === 'accepted') setVisible(false);
      } catch {
        //
      }
      return;
    }
    if (isIOS()) {
      setShowIOSInstructions(true);
      return;
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    setDismissed();
    setVisible(false);
    setShowIOSInstructions(false);
  };

  if (!visible) return null;

  return (
    <>
      <div
        role="banner"
        className="relative z-40 flex items-center justify-between gap-4 px-4 py-3 sm:px-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm sm:text-base truncate">
              InkFlow n&apos;est pas disponible en application
            </p>
            <p className="text-white/90 text-xs sm:text-sm truncate">
              Ajoutez-le à l&apos;écran d&apos;accueil pour y accéder comme une app
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            className="px-4 py-2 rounded-xl bg-white text-violet-700 font-semibold text-sm hover:bg-white/95 transition-colors shadow-sm"
          >
            Ajouter
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-2 rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showIOSInstructions && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowIOSInstructions(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="ios-install-title" className="text-lg font-bold text-neutral-900 mb-2">
              Ajouter sur l&apos;écran d&apos;accueil
            </h2>
            <p className="text-neutral-600 text-sm mb-4">
              Sur Safari, appuyez sur <strong>Partager</strong> (icône en bas) puis sur{' '}
              <strong>« Sur l&apos;écran d&apos;accueil »</strong>. InkFlow apparaîtra comme une application.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowIOSInstructions(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-900 text-white font-semibold text-sm hover:bg-neutral-800"
              >
                Compris
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="py-2.5 px-4 border border-neutral-300 rounded-xl text-neutral-700 text-sm font-medium hover:bg-neutral-50"
              >
                Ne plus afficher
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
