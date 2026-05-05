import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Logo } from '../components/Logo';
import { REDIRECT_AFTER_LOGIN_KEY } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { sendTattooerWelcomeEmailIfNeeded } from '../lib/sendNotification';
import { ensureStudio } from '../lib/supabaseDashboard';
import { resolvePostLoginPath, shouldSkipTattooerStudioBootstrap } from '../lib/postLoginRedirect';
import { markJustSignedUp, markWelcomeRequired } from '../lib/welcomeStorage';
import { isInkflowInternalStaffEmail } from '../lib/inkflowInternalStaff';

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
    /**
     * Magic link Supabase : les tokens arrivent dans le hash (#access_token=…).
     * Le paramètre redirect_to en query est souvent perdu après redirection.
     * URL dédiée /auth/callback/client → renvoie vers /discover (portail client web retiré).
     */
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const linkType = hashParams.get('type');
    if (linkType === 'signup' || linkType === 'email_change') {
      setMessage('Compte confirmé ! Ouverture de ton espace…');
    }
    const pathname = window.location.pathname.replace(/\/$/, '') || '/';
    const isClientCallback = pathname === '/auth/callback/client';
    const redirectToParam = params.get('redirect_to');
    const fromStorage =
      typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY)
        : null;
    const defaultPath = isClientCallback ? '/mon-compte' : '/dashboard';
    const rawRedirect = redirectToParam || fromStorage || defaultPath;
    try {
      sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
    } catch {
      // ignore
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const resolveSession = async () => {
      for (let i = 0; i < 8; i++) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) return session;
        await new Promise((r) => setTimeout(r, 100 + i * 50));
      }
      return null;
    };

    const run = async () => {
      const session = await resolveSession();
      const redirectUrl = await resolvePostLoginPath(rawRedirect, { defaultPath });
      if (cancelled) return;
      if (!session?.user) {
        timeoutId = setTimeout(() => {
          if (!cancelled) window.location.href = redirectUrl;
        }, 1200);
        return;
      }
      const u = session.user;
      const meta = u.user_metadata ?? {};
      const name = (meta.name as string) || u.email?.split('@')[0] || 'User';
      const studioName = (meta.studio_name as string) || 'Mon studio';
      const referralCode = (meta.referral_code as string) || undefined;
      const isClientFlow = shouldSkipTattooerStudioBootstrap(redirectUrl, isClientCallback);
      /** Parcours bienvenue tatoueur — pas pour les comptes équipe @ink-flow.me / founder. */
      if (!isClientFlow && !isInkflowInternalStaffEmail(u.email)) {
        const createdMs = u.created_at ? new Date(u.created_at).getTime() : 0;
        const isVeryNewAccount = createdMs > 0 && Date.now() - createdMs < 5 * 60 * 1000;
        if (linkType === 'signup' || isVeryNewAccount) {
          markJustSignedUp();
          const scope = u.email?.trim().toLowerCase() || u.id;
          if (scope) markWelcomeRequired(scope);
        }
      }
      if (!isClientFlow && !isInkflowInternalStaffEmail(u.email)) {
        try {
          await ensureStudio(u.email ?? '', name, studioName, referralCode);
          await sendTattooerWelcomeEmailIfNeeded();
        } catch {
          // Ne pas bloquer la redirection
        }
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
      <div className="landing-scroll bg-ink-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-ink-surface rounded-2xl p-8 border border-ink-border shadow-sm">
          <div className="text-center">
            <AlertCircle className="text-red-400 mx-auto mb-4" size={44} />
            <h1 className="text-2xl font-bold text-ink-text mb-2">Erreur</h1>
            <p className="text-ink-muted">{message}</p>
            <button
              type="button"
              onClick={goLogin}
              className="mt-6 w-full bg-ink-accent text-ink-bg font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-scroll min-h-screen bg-ink-bg flex flex-col items-center justify-center gap-4 p-6">
      <Logo size="lg" className="rounded-2xl" />
      <p className="text-sm text-neutral-600 text-center max-w-sm">{message}</p>
    </div>
  );
};
