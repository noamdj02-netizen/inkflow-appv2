import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Logo } from '../components/Logo';
import { REDIRECT_AFTER_LOGIN_KEY } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ensureStudio } from '../lib/supabaseDashboard';

export const AuthCallbackPage: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connexion en cours…');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error') || params.get('error_code');
    const errorDesc = params.get('error_description');

    if (error) {
      setStatus('error');
      setMessage(decodeURIComponent(errorDesc || error));
      return;
    }

    setStatus('success');
    const redirectUrl =
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY)) || '/dashboard';
    try {
      sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
    } catch {
      // ignore
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled || !session?.user) {
        timeoutId = setTimeout(() => { if (!cancelled) window.location.href = redirectUrl; }, 1000);
        return;
      }
      const u = session.user;
      const meta = u.user_metadata ?? {};
      const name = (meta.name as string) || u.email?.split('@')[0] || 'User';
      const studioName = (meta.studio_name as string) || 'Mon studio';
      try {
        await ensureStudio(u.email ?? '', name, studioName);
      } catch {
        // Ne pas bloquer la redirection
      }
      if (!cancelled) window.location.href = redirectUrl;
    };
    run();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const goLogin = () => {
    window.location.href = '/login';
  };

  if (status === 'error') {
    return (
      <div className="landing-scroll bg-neutral-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm">
          <div className="text-center">
            <AlertCircle className="text-red-600 mx-auto mb-4" size={44} />
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Erreur</h1>
            <p className="text-neutral-600">{message}</p>
            <button
              type="button"
              onClick={goLogin}
              className="mt-6 w-full bg-neutral-900 text-white font-semibold py-3 rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <Logo size="lg" className="rounded-2xl" />
    </div>
  );
};
