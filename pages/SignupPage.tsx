import React, { useMemo } from 'react';
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
    <div className="landing-scroll flex flex-col relative min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Fond dégradé */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-indigo-950/30 -z-10" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-200/40 dark:bg-violet-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-200/40 dark:bg-indigo-500/10 rounded-full blur-3xl -z-10" />

      <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a
            href={LANDING_URL}
            className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors min-h-[44px] items-center"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            <span className="font-medium">Retour</span>
          </a>
          <div className="flex items-center gap-2">
            <Logo className="dark:invert" size="sm" />
            <span className="font-bold text-zinc-900 dark:text-white">InkFlow</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 safe-bottom">
        <div className="w-full max-w-md">
          {/* Badge parrainage */}
          {hasRef && (
            <div className="mb-6 flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-800/50">
                <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  1 mois offert — lien parrainé
                </span>
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 text-zinc-900 dark:text-white font-display">
              Créez votre compte
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg">
              Commencez votre essai gratuit de 14 jours
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-xl shadow-zinc-200/60 dark:shadow-2xl dark:shadow-black/40">
            <SignupForm />
          </div>

          <p className="text-center mt-6 text-zinc-600 dark:text-zinc-400">
            Vous avez déjà un compte ?{' '}
            <a href="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Se connecter
            </a>
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>14 jours gratuits</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Pas de carte bancaire</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Annulation facile</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
