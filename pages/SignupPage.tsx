import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../components/Logo';
import { SignupForm } from '../components/auth/SignupForm';
import { LANDING_URL } from '../lib/urls';

export const SignupPage: React.FC = () => {
  return (
    <div className="landing-scroll flex flex-col relative min-h-screen bg-zinc-50 dark:bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:bg-black -z-10" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-200/30 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-200/30 rounded-full blur-3xl -z-10" />

      <header className="p-4 sm:p-6 safe-top">
        <a
          href={LANDING_URL}
          className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors min-h-[44px] items-center"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Retour</span>
        </a>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 safe-bottom">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <Logo className="dark:invert" />
              <span className="text-2xl font-bold text-zinc-900 dark:text-white">InkFlow</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2 text-zinc-900 dark:text-white font-display">
              Créez votre compte
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">Commencez votre essai gratuit de 14 jours</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
            <SignupForm />
          </div>

          <p className="text-center mt-6 text-zinc-600 dark:text-zinc-400">
            Vous avez déjà un compte ?{' '}
            <a href="/login" className="font-semibold text-zinc-900 dark:text-white hover:text-zinc-700 dark:hover:text-zinc-200">
              Se connecter
            </a>
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>14 jours gratuits</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Pas de carte bancaire</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Annulation facile</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
