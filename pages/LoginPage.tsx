import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../components/Logo';
import { LoginForm } from '../components/auth/LoginForm';
import { LANDING_URL } from '../lib/urls';

export const LoginPage: React.FC = () => {
  return (
    <div className="landing-scroll bg-zinc-50 dark:bg-black flex flex-col min-h-screen">
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

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 safe-bottom">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <Logo className="dark:invert" />
              <span className="text-2xl font-bold text-zinc-900 dark:text-white">InkFlow</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2 text-zinc-900 dark:text-white font-display">
              Bon retour !
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">Connectez-vous à votre compte</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
            <LoginForm />
          </div>

          <p className="text-center mt-6 text-zinc-600 dark:text-zinc-400">
            Pas encore de compte ?{' '}
            <a
              href="/signup"
              className="font-semibold text-zinc-900 dark:text-white hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              Créer un compte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
