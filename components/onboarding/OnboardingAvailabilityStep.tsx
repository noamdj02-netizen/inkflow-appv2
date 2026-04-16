/**
 * Onboarding Étape 3 — Disponibilités
 * Jours de travail + fenêtre de réservation
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Loader2 } from 'lucide-react';
import { Logo } from '../Logo';

const DAYS = [
  { label: 'Lun', value: 1 },
  { label: 'Mar', value: 2 },
  { label: 'Mer', value: 3 },
  { label: 'Jeu', value: 4 },
  { label: 'Ven', value: 5 },
  { label: 'Sam', value: 6 },
  { label: 'Dim', value: 0 },
];

const BOOKING_WINDOWS = [
  { label: '1 mois', days: 30 },
  { label: '2 mois', days: 60 },
  { label: '3 mois', days: 90 },
];

export interface OnboardingAvailabilityStepProps {
  onComplete: (offDays: number[], bookingWindowDays: number) => Promise<void>;
}

export const OnboardingAvailabilityStep: React.FC<OnboardingAvailabilityStepProps> = ({ onComplete }) => {
  // Par défaut : dimanche désactivé
  const [offDays, setOffDays] = useState<number[]>([0]);
  const [bookingWindow, setBookingWindow] = useState(60);
  const [loading, setLoading] = useState(false);

  const toggleDay = (v: number) => {
    setOffDays((prev) =>
      prev.includes(v) ? prev.filter((d) => d !== v) : [...prev, v]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onComplete(offDays, bookingWindow);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col lg:flex-row min-h-0 h-[100dvh] max-h-[100dvh] overflow-hidden bg-white dark:bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-labelledby="avail-title"
    >
      {/* Left — Formulaire */}
      <div className="flex-1 flex flex-col min-h-0 max-h-full overflow-y-auto overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
        <div className="lg:hidden flex-shrink-0 h-28 sm:h-36 relative overflow-hidden safe-top">
          <img
            src="/images/fallon-michael-EQucs66pts0-unsplash.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black via-transparent to-transparent" />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 py-5 sm:py-8 safe-bottom min-h-0">
          <motion.div
            className="w-full max-w-sm mx-auto py-4 sm:py-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 mb-5 sm:mb-6">
              <Logo className="dark:invert" />
              <span className="text-xl font-bold text-zinc-900 dark:text-white">InkFlow</span>
            </div>

            <h1 id="avail-title" className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1 sm:mb-1.5">
              Vos disponibilités
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-5 sm:mb-6">
              Configurez vos jours de travail et la fenêtre de réservation pour vos clients.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Jours de travail */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-3">
                  <CalendarDays className="inline w-4 h-4 mr-2 -mt-0.5" />
                  Jours de travail
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS.map(({ label, value }) => {
                    const isOff = offDays.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleDay(value)}
                        disabled={loading}
                        className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl text-xs font-semibold transition-all active:scale-[0.95] touch-manipulation ${
                          isOff
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-700 line-through'
                            : 'bg-blue-600 text-white border border-blue-600 shadow-sm'
                        }`}
                        title={isOff ? `${label} : repos` : `${label} : travail`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                  Cliquez pour activer / désactiver un jour.
                </p>
              </div>

              {/* Fenêtre de réservation */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-3">
                  Clients peuvent réserver jusqu'à…
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {BOOKING_WINDOWS.map(({ label, days }) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setBookingWindow(days)}
                      disabled={loading}
                      className={`min-h-[48px] rounded-xl text-sm font-semibold transition-all active:scale-[0.97] touch-manipulation ${
                        bookingWindow === days
                          ? 'bg-blue-600 text-white border border-blue-600'
                          : 'bg-zinc-50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 active:scale-[0.98] touch-manipulation"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  'Continuer'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Right — Hero (desktop) */}
      <motion.div
        className="hidden lg:flex lg:w-[520px] xl:w-[600px] min-h-screen flex-shrink-0 relative overflow-hidden"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <img
          src="/images/fallon-michael-EQucs66pts0-unsplash.jpg"
          alt="Tatoueur"
          className="absolute inset-0 w-full min-h-full object-cover object-bottom"
          loading="eager"
        />
        <div className="absolute bottom-0 left-0 right-0 z-10 px-10 pb-10 pt-16 pointer-events-none">
          <h2 className="text-white text-2xl font-bold leading-snug mb-1 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
            Gérez votre studio.
          </h2>
          <p className="text-white text-base [text-shadow:0_2px_6px_rgba(0,0,0,0.8)]">Libérez votre art.</p>
        </div>
      </motion.div>
    </motion.div>
  );
};
