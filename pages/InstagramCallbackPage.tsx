import React, { useEffect, useState } from 'react';
import { Logo } from '../components/Logo';
import { exchangeInstagramCode } from '../lib/instagram';

const SITE_URL = (typeof window !== 'undefined' ? window.location.origin : '').replace(/\/+$/, '');

export const InstagramCallbackPage: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state'); // studioId

    if (!code || !state) {
      setStatus('error');
      setErrorMsg('Paramètres de connexion manquants');
      return;
    }

    exchangeInstagramCode(state, code)
      .then(({ redirectUrl }) => {
        setStatus('success');
        window.location.href = redirectUrl || `${SITE_URL}/dashboard?ig=connected`;
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : 'Erreur de connexion');
      });
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6">
        <Logo size="lg" className="rounded-2xl mb-6" />
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="mt-4 text-sm text-[var(--text-secondary)]">Connexion Instagram en cours...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl" aria-hidden>⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Échec de la connexion</h1>
          <p className="text-[var(--text-secondary)] text-sm mb-6">{errorMsg}</p>
          <button
            onClick={() => { window.location.href = '/dashboard'; }}
            className="px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl font-semibold hover:opacity-90"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6">
      <Logo size="lg" className="rounded-2xl mb-6" />
      <p className="text-sm text-[var(--text-secondary)]">Redirection...</p>
    </div>
  );
};
