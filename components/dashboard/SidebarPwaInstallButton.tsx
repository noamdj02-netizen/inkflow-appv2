import React, { useState, useLayoutEffect, useCallback } from 'react';
import { Smartphone } from 'lucide-react';

/** Événement non standard : invite d’installation PWA (Chrome / Edge / Android). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as unknown as { standalone?: boolean };
  /** iOS Safari « Sur l’écran d’accueil » */
  if (nav.standalone === true) return true;
  /** PWA installée (Chrome, Edge, etc.) — évite les faux positifs si plusieurs media queries matchent */
  try {
    return window.matchMedia('(display-mode: standalone)').matches === true;
  } catch {
    return false;
  }
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function navigateToInstaller(): void {
  window.history.pushState({}, '', '/installer');
  window.dispatchEvent(new Event('inkflow-navigate'));
}

export interface SidebarPwaInstallButtonProps {
  /** Ex. fermer la sidebar mobile après action */
  onAfterAction?: () => void;
}

export const SidebarPwaInstallButton: React.FC<SidebarPwaInstallButtonProps> = ({ onAfterAction }) => {
  /** Dès le 1er rendu client : pas d’attente useEffect (évite un CTA invisible si le flex coupe le bas du nav). */
  const [visible] = useState(() => (typeof window !== 'undefined' ? !isStandalone() : false));
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || !visible) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [visible]);

  const handleClick = useCallback(async () => {
    onAfterAction?.();
    if (deferredPrompt?.prompt) {
      try {
        await deferredPrompt.prompt();
      } catch {
        //
      }
      setDeferredPrompt(null);
      return;
    }
    if (isIOS()) {
      setShowIOSInstructions(true);
      return;
    }
    navigateToInstaller();
  }, [deferredPrompt, onAfterAction]);

  if (!visible) return null;

  return (
    <>
      <div className="px-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/50 mt-2">
        <p className="text-[10px] font-semibold tracking-widest text-zinc-400/60 dark:text-zinc-500/60 px-3 mb-1.5 uppercase">Application</p>
        <button
          type="button"
          onClick={handleClick}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold transition-all active:scale-[0.98] border border-emerald-500/35 dark:border-emerald-500/30 bg-emerald-500/[0.08] dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/15 dark:hover:bg-emerald-500/20"
        >
          <Smartphone className="w-4 h-4 flex-shrink-0" aria-hidden />
          <span className="flex-1 text-left">Ajouter l&apos;app</span>
        </button>
        <p className="mt-1.5 px-3 text-[10px] leading-snug text-zinc-400 dark:text-zinc-500">
          Raccourci sur l&apos;écran d&apos;accueil, comme une app native
        </p>
      </div>

      {showIOSInstructions && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sidebar-ios-install-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowIOSInstructions(false)}
        >
          <div
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl max-w-sm w-full p-6 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="sidebar-ios-install-title" className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
              Sur l&apos;écran d&apos;accueil
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">
              Dans Safari, appuyez sur <strong className="text-zinc-800 dark:text-zinc-200">Partager</strong> puis sur{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">« Sur l&apos;écran d&apos;accueil »</strong>.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowIOSInstructions(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                Compris
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowIOSInstructions(false);
                  navigateToInstaller();
                }}
                className="py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors active:scale-[0.98]"
              >
                Guide détaillé
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
