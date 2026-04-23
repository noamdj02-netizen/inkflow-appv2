import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CalendarDays, Heart, Mail, Map, MapPin, User, Wallet } from 'lucide-react';
import { Logo } from '../components/Logo';
import { LoginForm } from '../components/auth/LoginForm';
import { SEO } from '../components/SEO';
import { LANDING_URL, APP_URL, sanitizePostAuthRedirect } from '../lib/urls';
import { resolvePostLoginPath, shouldRedirectPortalClientFromProDashboard } from '../lib/postLoginRedirect';
import { REDIRECT_AFTER_LOGIN_KEY, useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { CLIENT_DASHBOARD_THEME } from '../lib/clientDashboardTheme';

const LOGIN_HERO_PRIMARY = '/images/login-hero.jpg';
const LOGIN_HERO_ABSOLUTE = `${APP_URL}/images/login-hero.jpg`;

/* ── Onboarding slides ──────────────────────────────────────────────────────── */
const ONBOARD_SLIDES = [
  {
    img: '/images/client-hero1.jpg',
    logo: true,
    title: 'INKFLOW',
    sub: 'Trouve ton tatoueur près de chez toi.',
    desc: '',
    Icon: null as React.ElementType | null,
  },
  {
    img: '/images/referral-hero-studio1.png',
    logo: false,
    title: 'Tes RDV en un clin d\'œil',
    sub: 'Rappels automatiques, statuts en temps réel et historique de tous tes tatouages.',
    desc: '',
    Icon: CalendarDays,
  },
  {
    img: '/images/referral-hero-studio2.jpg',
    logo: false,
    title: 'Wallet & Fidélité',
    sub: 'Cumule des points à chaque session et profite de remises exclusives dans tes studios préférés.',
    desc: '',
    Icon: Wallet,
  },
  {
    img: '/images/referral-hero-studio3.png',
    logo: false,
    title: 'Ton univers tatouage',
    sub: 'Portfolio, avis et actu de tes artistes préférés — au même endroit.',
    desc: '',
    Icon: Heart,
  },
  {
    img: '/images/collin-wigger-n4kHuY-2va0-unsplash.jpg',
    logo: false,
    title: 'Découvrir les studios',
    sub: 'Flashs disponibles, artistes proches, réservation instantanée. Tout est là.',
    desc: '',
    Icon: Map,
  },
] as const;

function ClientOnboarding({ onDone }: { onDone: () => void }) {
  const [slide, setSlide] = useState(0);
  const [dir, setDir] = useState(1);
  const total = ONBOARD_SLIDES.length;
  const s = ONBOARD_SLIDES[slide];
  const clientAccent = CLIENT_DASHBOARD_THEME.accent;
  const clientOnAccent = CLIENT_DASHBOARD_THEME.onAccent;
  const clientAccentShadow = CLIENT_DASHBOARD_THEME.accentShadow;
  const clientAccentSoft = CLIENT_DASHBOARD_THEME.accentMuted;

  const goNext = () => {
    if (slide < total - 1) { setDir(1); setSlide(slide + 1); }
    else { onDone(); }
  };
  const goPrev = () => {
    if (slide > 0) { setDir(-1); setSlide(slide - 1); }
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <motion.div
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: 9999, background: '#000', height: '100dvh' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Slide background — popLayout avoids stacking during transition */}
      <AnimatePresence custom={dir} mode="popLayout">
        <motion.div
          key={slide}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.38, ease: [0.32, 0, 0.67, 0] }}
          className="absolute inset-0"
          style={{ height: '100dvh' }}
          /* swipe gesture */
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={(_e, info) => {
            if (info.offset.x < -50) goNext();
            else if (info.offset.x > 50) goPrev();
          }}
        >
          <img
            src={s.img}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: slide === 0
                ? 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0.75) 65%, rgba(0,0,0,1) 100%)'
                : 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,1) 100%)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* IF. logo top-left */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 z-10"
        style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
        <span className="text-2xl font-black text-white tracking-tighter drop-shadow-lg" style={{ letterSpacing: '-0.04em' }}>
          IF.
        </span>
        {slide > 0 && (
          <button type="button" onClick={goPrev}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Content bottom */}
      <div className="absolute inset-x-0 bottom-0 px-6 z-10"
        style={{ paddingBottom: 'max(40px, env(safe-area-inset-bottom, 40px))' }}>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={`content-${slide}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {s.Icon && (
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: clientAccentSoft, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <s.Icon className="w-6 h-6 text-white" />
              </div>
            )}

            {slide === 0 && (
              <p
                className="text-white mb-2 leading-none font-black uppercase tracking-tight"
                style={{
                  fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
                  letterSpacing: '-0.04em',
                  fontSize: 'clamp(2.75rem, 13vw, 4.5rem)',
                }}
              >
                INKFLOW
              </p>
            )}

            <h2 className={`font-black text-white leading-tight mb-3 ${slide === 0 ? 'text-xl' : 'text-3xl'}`}
              style={{ letterSpacing: slide === 0 ? '0' : '-0.02em' }}>
              {slide === 0 ? s.sub : s.title}
            </h2>

            {slide > 0 && s.sub && (
              <p className="text-base mb-5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
                {s.sub}
              </p>
            )}

            <div className="flex gap-1.5 mb-5">
              {ONBOARD_SLIDES.map((_, i) => (
                <button key={i} type="button" onClick={() => { setDir(i > slide ? 1 : -1); setSlide(i); }}
                  className="rounded-full transition-all duration-300"
                  style={{ width: i === slide ? 20 : 6, height: 6, background: i === slide ? clientAccent : 'rgba(255,255,255,0.35)' }}
                />
              ))}
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={goNext}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black tracking-wide"
              style={{
                background: clientAccent,
                color: clientOnAccent,
                boxShadow: `0 8px 28px ${clientAccentShadow}`,
                letterSpacing: '0.06em',
              }}
            >
              {slide === 0 || slide === total - 1 ? 'COMMENCER' : 'Suivant'}
              {slide > 0 && slide < total - 1 && <ArrowRight className="w-4 h-4" />}
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

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
  const [inviteTeamEmailPending, setInviteTeamEmailPending] = useState(initialQ.inviteTeam);
  /** E-mail pour renvoyer la confirmation (URL + saisie dans le formulaire). */
  const [loginEmailForResend, setLoginEmailForResend] = useState(initialQ.confirmEmail);
  const [resendLoading, setResendLoading] = useState(false);
  const canResendConfirmation =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmailForResend.trim());
  const [heroSrc, setHeroSrc] = useState(LOGIN_HERO_PRIMARY);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const handleHeroError = () => {
    setHeroSrc((prev) => {
      if (prev === LOGIN_HERO_PRIMARY) return LOGIN_HERO_ABSOLUTE;
      return prev;
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get('redirect') || params.get('returnTo') || params.get('next');
    if (redirectParam) {
      const safe = sanitizePostAuthRedirect(decodeURIComponent(redirectParam));
      try {
        sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, safe);
      } catch {
        /* ignore */
      }
    }
    if (params.get('message') === 'check-email' || redirectParam || params.get('email') || params.get('invite')) {
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
      const target =
        user && (await shouldRedirectPortalClientFromProDashboard(user)) ? '/client/dashboard' : path;
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
    <AnimatePresence>
      {showOnboarding && (
        <ClientOnboarding onDone={() => { window.location.href = '/client/dashboard'; }} />
      )}
    </AnimatePresence>
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
                    Compte créé ! Ouvrez l’e-mail InkFlow et cliquez sur le lien pour activer votre compte.
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {inviteTeamEmailPending ? (
                      <>
                        Invitation équipe : ouvrez l&apos;email de confirmation, validez votre compte, puis{' '}
                        <strong className="font-semibold">revenez sur cette page</strong> pour vous connecter avec la
                        même adresse (celle du tatoueur).
                      </>
                    ) : (
                      <>Cliquez sur le lien dans l&apos;email pour activer votre compte.</>
                    )}
                  </p>
                  <p className="text-xs text-emerald-700/90 dark:text-emerald-300/90 mt-2">
                    Rien reçu ? Vérifiez les courriers indésirables, puis utilisez le bouton sous le champ e-mail.
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
                    toast.success('Lien d’activation envoyé. Vérifiez votre boîte (et les spams).');
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Impossible de renvoyer l’e-mail.');
                  } finally {
                    setResendLoading(false);
                  }
                }}
                className="mt-3 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition-all active:scale-[0.98] disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100 min-h-[48px]"
              >
                {resendLoading ? 'Envoi…' : 'Renvoyer l’e-mail de confirmation'}
              </button>
            )}

            {/* Séparateur */}
            <div className="relative my-1 flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
              <span className="text-xs text-zinc-400 dark:text-zinc-600 font-medium">ou</span>
              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            </div>

            {/* Bouton Espace Client — déclenche l'onboarding */}
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-bold transition-all active:scale-[0.98]"
              style={{
                background: '#60A5FA',
                color: '#ffffff',
                boxShadow: '0 0 24px rgba(96,165,250,0.30)',
              }}
            >
              <User className="w-4 h-4 shrink-0" aria-hidden />
              Accéder à l'Espace Client
            </button>

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
          <p className="text-white text-base [text-shadow:0_2px_6px_rgba(0,0,0,0.8)]">Libérez votre art.</p>
        </div>
      </motion.div>
    </motion.div>
    </>
  );
};
