import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail } from 'lucide-react';
import { Logo } from '../components/Logo';
import { LoginForm } from '../components/auth/LoginForm';
import { SEO } from '../components/SEO';
import { LANDING_URL, APP_URL, sanitizePostAuthRedirect } from '../lib/urls';
import {
  resolvePostLoginPath,
  remapSunsetClientPortalPaths,
  shouldRedirectPortalClientFromProDashboard,
  getRedirectPathnameOnly,
} from '../lib/postLoginRedirect';
import {
  INKFLOW_EMAIL_UNVERIFIED_KEY,
  REDIRECT_AFTER_LOGIN_KEY,
  useAuth,
} from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const LOGIN_HERO_PRIMARY = '/images/login-hero.jpg';
const LOGIN_HERO_ABSOLUTE = `${APP_URL}/images/login-hero.jpg`;

function readLoginPageQueryOnce(): {
  checkEmail: boolean;
  inviteTeam: boolean;
  confirmEmail: string;
  redirectParam: string | null;
} {
  if (typeof window === 'undefined') {
    return { checkEmail: false, inviteTeam: false, confirmEmail: '', redirectParam: null };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    checkEmail: params.get('message') === 'check-email',
    inviteTeam: params.get('invite') === '1',
    confirmEmail: params.get('email')?.trim() ?? '',
    redirectParam: params.get('redirect') || params.get('returnTo') || params.get('next'),
  };
}

export const LoginPage: React.FC = () => {
  const { user, isAuthenticated, authLoading, resendSignupConfirmation } = useAuth();
  const toast = useToast();
  const initialQ = readLoginPageQueryOnce();
  const [checkEmailMessage, setCheckEmailMessage] = useState(initialQ.checkEmail);
  const [inviteTeamEmailPending] = useState(initialQ.inviteTeam);
  /** E-mail pour renvoyer la confirmation (URL + saisie dans le formulaire). */
  const [loginEmailForResend, setLoginEmailForResend] = useState(initialQ.confirmEmail);
  const [resendLoading, setResendLoading] = useState(false);
  const canResendConfirmation = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmailForResend.trim());
  const [heroSrc, setHeroSrc] = useState(LOGIN_HERO_PRIMARY);
  const handleHeroError = () => {
    setHeroSrc((prev) => {
      if (prev === LOGIN_HERO_PRIMARY) return LOGIN_HERO_ABSOLUTE;
      return prev;
    });
  };

  useEffect(() => {
    try {
      if (sessionStorage.getItem(INKFLOW_EMAIL_UNVERIFIED_KEY)) {
        setCheckEmailMessage(true);
        sessionStorage.removeItem(INKFLOW_EMAIL_UNVERIFIED_KEY);
      }
    } catch {
      /* ignore */
    }
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get('redirect') || params.get('returnTo') || params.get('next');
    if (redirectParam) {
      const safe = remapSunsetClientPortalPaths(
        sanitizePostAuthRedirect(decodeURIComponent(redirectParam))
      );
      try {
        sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, safe);
      } catch {
        /* ignore */
      }
    }
    if (
      params.get('message') === 'check-email' ||
      redirectParam ||
      params.get('email') ||
      params.get('invite')
    ) {
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  /** Déjà connecté : renvoie vers la cible résolue (dashboard tatoueur, /client, /admin équipe, etc.). */
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      let next = '/dashboard';
      try {
        const stored = sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
        if (stored) next = sanitizePostAuthRedirect(stored);
        sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
      } catch {
        /* ignore */
      }
      const path = await resolvePostLoginPath(next);
      if (cancelled) return;
      const portalOnly = user && (await shouldRedirectPortalClientFromProDashboard(user));
      const target =
        portalOnly && getRedirectPathnameOnly(path) !== '/mon-compte' ? '/discover' : path;
      window.history.replaceState({}, '', target);
      window.dispatchEvent(new Event('inkflow-navigate'));
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, user]);

  if (!authLoading && isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black">
        <Logo className="dark:invert" />
        <p className="mt-4 text-sm text-zinc-500">Redirection…</p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="min-h-[100dvh] min-h-screen flex bg-white dark:bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <SEO
          title="Connexion"
          description="Connectez-vous à votre espace InkFlow : agenda, réservations, clients et paiements Stripe pour votre studio de tatouage."
          canonical="/login"
          keywords="connexion InkFlow, espace tatoueur, login studio tattoo"
          ogImageAlt="Connexion InkFlow"
        />
        {/* ── LEFT — Login Form (scrollable : Safari / clavier mobile) ── */}
        <div className="flex-1 flex flex-col min-h-0 min-h-[100dvh]">
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

          <div
            className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex min-h-min min-h-full flex-col justify-start sm:justify-center px-6 sm:px-10 py-6 sm:py-8 pb-8 safe-bottom">
              <motion.div
                className="w-full max-w-sm mx-auto"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                {/* Logo + Title */}
                <div className="mb-8">
                  {/* Logo centré — style iOS native app icon */}
                  <div className="flex flex-col items-start mb-7">
                    <div className="mb-3.5 relative">
                      <Logo
                        size="xl"
                        className="shadow-[0_4px_20px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
                      />
                    </div>
                    <span
                      className="text-[22px] font-black text-zinc-900 dark:text-white uppercase"
                      style={{ letterSpacing: '-0.04em', lineHeight: 1 }}
                    >
                      INKFLOW
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1.5">
                    Bon retour !
                  </h1>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                    Connectez-vous à votre compte
                  </p>
                </div>

                {/* Email confirmation message */}
                {checkEmailMessage && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 mb-5">
                    <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                        Compte créé ! Ouvrez l’e-mail InkFlow et cliquez sur le lien pour activer
                        votre compte.
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {inviteTeamEmailPending ? (
                          <>
                            Invitation équipe : ouvrez l&apos;email de confirmation, validez votre
                            compte, puis{' '}
                            <strong className="font-semibold">revenez sur cette page</strong> pour
                            vous connecter avec la même adresse (celle du tatoueur).
                          </>
                        ) : (
                          <>Cliquez sur le lien dans l&apos;email pour activer votre compte.</>
                        )}
                      </p>
                      <p className="text-xs text-emerald-700/90 dark:text-emerald-300/90 mt-2">
                        Rien reçu ? Vérifiez les courriers indésirables, puis utilisez le bouton
                        sous le champ e-mail.
                      </p>
                    </div>
                  </div>
                )}

                <LoginForm
                  prefillEmail={initialQ.confirmEmail || undefined}
                  onEmailChange={setLoginEmailForResend}
                />

                {checkEmailMessage && (
                  <button
                    type="button"
                    disabled={resendLoading || !canResendConfirmation}
                    onClick={async () => {
                      setResendLoading(true);
                      try {
                        await resendSignupConfirmation(loginEmailForResend.trim());
                        toast.success(
                          'Lien d’activation envoyé. Vérifiez votre boîte (et les spams).'
                        );
                      } catch (e) {
                        toast.error(
                          e instanceof Error ? e.message : 'Impossible de renvoyer l’e-mail.'
                        );
                      } finally {
                        setResendLoading(false);
                      }
                    }}
                    className="mt-3 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition-all active:scale-[0.98] disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100 min-h-[48px]"
                  >
                    {resendLoading ? 'Envoi…' : 'Renvoyer l’e-mail de confirmation'}
                  </button>
                )}

                <p className="text-center mt-6 text-sm text-zinc-500 dark:text-zinc-400">
                  Pas encore de compte ?{' '}
                  <a
                    href="/signup"
                    className="font-semibold text-zinc-900 dark:text-white hover:text-zinc-700 dark:hover:text-zinc-200 underline underline-offset-2"
                  >
                    Créer un compte
                  </a>
                </p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── RIGHT — Hero Photo Panel (desktop only, 100vh) ── */}
        <motion.div
          className="hidden lg:flex lg:w-[520px] xl:w-[600px] min-h-screen h-screen flex-shrink-0 relative overflow-hidden"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <img
            src={heroSrc}
            alt="Tatoueur"
            className="absolute inset-0 w-full min-h-full object-cover object-bottom"
            loading="eager"
            fetchPriority="high"
            onError={handleHeroError}
          />

          <div className="absolute bottom-0 left-0 right-0 z-10 px-10 pb-10 pt-16 pointer-events-none">
            <h2 className="text-white text-2xl font-bold leading-snug mb-1 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
              Gérez votre studio.
            </h2>
            <p className="text-white text-base [text-shadow:0_2px_6px_rgba(0,0,0,0.8)]">
              Libérez votre art.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};
