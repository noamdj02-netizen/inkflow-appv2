/**
 * Onboarding — Notifications (push Web + rappel navigateur).
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Loader2, Smartphone } from 'lucide-react';
import { Logo } from '../Logo';
import { useToast } from '../../contexts/ToastContext';
import { usePushSubscription } from '../../hooks/usePushSubscription';

const heroImg = '/images/fallon-michael-EQucs66pts0-unsplash.jpg';

export interface OnboardingNotificationsStepProps {
  studioId: string;
  onComplete: () => void;
}

export const OnboardingNotificationsStep: React.FC<OnboardingNotificationsStepProps> = ({
  studioId,
  onComplete,
}) => {
  const toast = useToast();
  const { subscribe, isSupported, permission, loading, error, supportReason } = usePushSubscription(studioId);

  const handleEnable = async () => {
    const ok = await subscribe();
    if (ok) {
      toast.success('Tu recevras les alertes pour les demandes et les acomptes.');
      onComplete();
      return;
    }
    if (error) toast.error(error);
  };

  const handleSkip = () => {
    onComplete();
  };

  const showUnsupported = !isSupported;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col lg:flex-row min-h-0 h-[100dvh] max-h-[100dvh] overflow-hidden bg-white dark:bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-labelledby="notif-title"
    >
      <div className="flex-1 flex flex-col min-h-0 max-h-full overflow-y-auto overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
        <div className="lg:hidden flex-shrink-0 h-28 sm:h-36 relative overflow-hidden safe-top">
          <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover object-center" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black via-transparent to-transparent" />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 py-5 sm:py-8 safe-bottom min-h-0">
          <motion.div
            className="w-full max-w-md mx-auto py-4 sm:py-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 mb-5 sm:mb-6">
              <Logo className="dark:invert" />
              <span className="text-xl font-bold text-zinc-900 dark:text-white">InkFlow</span>
            </div>

            <h1 id="notif-title" className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1.5">
              Reste informé
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-5 sm:mb-6">
              Active les notifications pour être alerté des nouvelles demandes de rendez-vous et des paiements d’acompte, même
              quand l’app n’est pas ouverte (selon ton navigateur / appareil).
            </p>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-4 sm:p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/20 shrink-0">
                  <Bell className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-semibold text-zinc-900 dark:text-white">Notifications push</p>
                  {showUnsupported ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-start gap-2">
                      <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
                      {supportReason === 'no_vapid'
                        ? 'Les notifications push ne sont pas configurées sur ce serveur. Tu pourras les activer plus tard dans Paramètres.'
                        : 'Sur certains navigateurs, installe InkFlow en application (PWA) depuis le menu du navigateur pour recevoir les alertes.'}
                    </p>
                  ) : permission === 'granted' ? (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">Notifications déjà autorisées pour ce site.</p>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Une fenêtre du navigateur peut demander ton autorisation — c’est normal.
                    </p>
                  )}
                </div>
              </div>

              {!showUnsupported && permission !== 'granted' && (
                <button
                  type="button"
                  onClick={() => void handleEnable()}
                  disabled={loading}
                  className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 active:scale-[0.98] transition-all"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
                  Activer les notifications
                </button>
              )}

              {(showUnsupported || permission === 'granted') && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full min-h-[48px] rounded-xl font-semibold text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 active:scale-[0.98] transition-all"
                >
                  Continuer
                </button>
              )}

              {!showUnsupported && permission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full min-h-[44px] text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  Plus tard — accéder au tableau de bord
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="hidden lg:flex lg:w-[520px] xl:w-[600px] min-h-screen flex-shrink-0 relative overflow-hidden"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <img src={heroImg} alt="" className="absolute inset-0 w-full min-h-full object-cover object-bottom" loading="eager" />
        <div className="absolute bottom-0 left-0 right-0 z-10 px-10 pb-10 pt-16 pointer-events-none">
          <h2 className="text-white text-2xl font-bold leading-snug mb-1 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
            Ne rate rien.
          </h2>
          <p className="text-white text-base [text-shadow:0_2px_6px_rgba(0,0,0,0.8)]">Demandes et encaissements en temps réel.</p>
        </div>
      </motion.div>
    </motion.div>
  );
};
