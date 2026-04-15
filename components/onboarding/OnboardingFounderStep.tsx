/**
 * Onboarding Étape 1 — Note du fondateur
 * Style épuré aligné sur la page login
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Logo } from '../Logo';

const FOUNDER_NOTE = `Bienvenue dans InkFlow.

J'ai créé cette app parce que, comme toi, j'ai passé des heures à gérer mes RDV sur des carnets, à oublier des acomptes, à chercher un design dans des centaines de photos.

InkFlow, c'est l'outil que j'aurais voulu avoir dès mon premier jour en tant que tatoueur.`;

/** Délai minimum avant de pouvoir continuer (lecture). */
const FOUNDER_CONTINUE_DELAY_SEC = 6;

export interface OnboardingFounderStepProps {
  onNext: () => void;
}

export const OnboardingFounderStep: React.FC<OnboardingFounderStepProps> = ({ onNext }) => {
  const [secondsLeft, setSecondsLeft] = useState(FOUNDER_CONTINUE_DELAY_SEC);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const canContinue = secondsLeft <= 0;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex min-h-screen bg-white dark:bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-labelledby="founder-title"
      aria-describedby="founder-note"
    >
      {/* Left — Contenu */}
      <div className="flex-1 flex flex-col min-h-screen min-h-[100dvh] overflow-y-auto">
        {/* Hero compact mobile */}
        <div className="lg:hidden flex-shrink-0 h-32 sm:h-40 relative overflow-hidden safe-top">
          <img
            src="/images/fallon-michael-EQucs66pts0-unsplash.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black via-transparent to-transparent" />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 py-6 sm:py-8 safe-bottom min-h-0">
          <motion.div
            className="w-full max-w-sm mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 mb-6 sm:mb-8">
              <Logo className="dark:invert" />
              <span className="text-xl font-bold text-zinc-900 dark:text-white">InkFlow</span>
            </div>

            <h1 id="founder-title" className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3 sm:mb-4">
              Une note du fondateur
            </h1>

            <div
              id="founder-note"
              className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed whitespace-pre-line mb-6 sm:mb-8"
            >
              {FOUNDER_NOTE}
            </div>

            <button
              type="button"
              onClick={onNext}
              disabled={!canContinue}
              className="w-full min-h-[48px] py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:text-zinc-500 dark:disabled:text-zinc-400 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98] touch-manipulation"
            >
              {!canContinue ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin opacity-80" />
                  Lecture… {secondsLeft}s
                </>
              ) : (
                <>
                  C&apos;est parti
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
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
