import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Gift } from 'lucide-react';
import { Logo } from '../components/Logo';
import { SignupForm } from '../components/auth/SignupForm';
import { LANDING_URL } from '../lib/urls';

export const SignupPage: React.FC = () => {
  const hasRef = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!new URLSearchParams(window.location.search).get('ref');
  }, []);

  return (
    <motion.div
      className="min-h-screen flex bg-white dark:bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── LEFT — Signup Form ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <header className="p-4 sm:p-6 safe-top flex-shrink-0">
          <a
            href={LANDING_URL}
            className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Retour</span>
          </a>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-8 safe-bottom">
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {/* Logo + Title */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 mb-6">
                <Logo className="dark:invert" />
                <span className="text-xl font-bold text-zinc-900 dark:text-white">InkFlow</span>
              </div>

              {/* Badge parrainage */}
              {hasRef && (
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-800/50">
                    <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                      1 mois offert — lien parrainé
                    </span>
                  </div>
                </div>
              )}

              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1.5">
                Créez votre compte
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Essai gratuit de 14 jours · Sans carte bancaire
              </p>
            </div>

            <SignupForm />

            <p className="text-center mt-6 text-sm text-zinc-500 dark:text-zinc-400">
              Vous avez déjà un compte ?{' '}
              <a
                href="/login"
                className="font-semibold text-zinc-900 dark:text-white hover:text-zinc-700 dark:hover:text-zinc-200 underline underline-offset-2"
              >
                Se connecter
              </a>
            </p>

            {/* Garanties */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
              {['14 jours gratuits', 'Pas de carte bancaire', 'Annulation facile'].map((g) => (
                <div key={g} className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Hero Photo Panel (desktop, 100vh) ── */}
      <div className="hidden md:flex md:w-[480px] lg:w-[520px] xl:w-[600px] min-h-screen h-screen flex-shrink-0 relative overflow-hidden">
        {/* Photo étirée pleine hauteur, ancrée en bas, responsive */}
        <img
          src="/images/referral-hero-studio.png"
          alt="Studio de tatouage"
          className="absolute inset-0 w-full min-h-full object-cover object-bottom"
          loading="eager"
          fetchPriority="high"
        />

        {/* Texte en overlay par-dessus la photo */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-10 pb-10 pt-16 pointer-events-none">
          <h2 className="text-white text-2xl font-bold leading-snug mb-1 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
            Votre art mérite<br />le meilleur outil.
          </h2>
          <p className="text-white text-base [text-shadow:0_2px_6px_rgba(0,0,0,0.8)]">Rejoignez 500+ tatoueurs sur InkFlow.</p>
        </div>
      </motion.div>
    </motion.div>
  );
};
