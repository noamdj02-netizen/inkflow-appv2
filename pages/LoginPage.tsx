import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CalendarDays, Heart, Mail, Map, MapPin, User, Wallet } from 'lucide-react';
import { Logo } from '../components/Logo';
import { LoginForm } from '../components/auth/LoginForm';
import { SEO } from '../components/SEO';
import { LANDING_URL, APP_URL } from '../lib/urls';
import loginHeroImg from '../src/assets/login-hero.jpg';

const LOGIN_HERO_FALLBACK = '/images/login-hero.jpg';
const LOGIN_HERO_ABSOLUTE = `${APP_URL}/images/login-hero.jpg`;

/* ── Onboarding slides ──────────────────────────────────────────────────────── */
const ONBOARD_SLIDES = [
  {
    img: '/images/ravi-sharma-7KMzdNfIlQY-unsplash.jpg',
    logo: true,
    title: 'INKFLOW',
    sub: 'Ton espace tatouage personnel',
    desc: '',
    Icon: null as React.ElementType | null,
  },
  {
    img: '/images/fallon-michael-EQucs66pts0-unsplash.jpg',
    logo: false,
    title: 'Tes RDV en un clin d\'œil',
    sub: 'Rappels automatiques, statuts en temps réel et historique de tous tes tatouages.',
    desc: '',
    Icon: CalendarDays,
  },
  {
    img: '/images/client-hero.webp',
    logo: false,
    title: 'Wallet & Fidélité',
    sub: 'Cumule des points à chaque session et profite de remises exclusives dans tes studios préférés.',
    desc: '',
    Icon: Wallet,
  },
  {
    img: '/images/ravi-sharma-7KMzdNfIlQY-unsplash.jpg',
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

  // Load Pacifico font for the script logo
  useEffect(() => {
    if (document.getElementById('pacifico-font')) return;
    const link = document.createElement('link');
    link.id = 'pacifico-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap';
    document.head.appendChild(link);
  }, []);

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
      className="fixed inset-0 overflow-hidden" style={{ zIndex: 9999 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <AnimatePresence custom={dir} mode="sync">
        <motion.div
          key={slide}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.42, ease: [0.32, 0, 0.67, 0] }}
          className="absolute inset-0"
        >
          {/* Full-screen background photo */}
          <img
            src={s.img}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: slide === 0
                ? 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.88) 70%, rgba(0,0,0,1) 100%)'
                : 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.9) 65%, rgba(0,0,0,1) 100%)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* IF. logo top-left */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-safe-top"
        style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
        <span className="text-2xl font-black text-white tracking-tighter drop-shadow-lg" style={{ letterSpacing: '-0.04em' }}>
          IF.
        </span>
        {slide > 0 && (
          <button type="button" onClick={goPrev}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Content bottom */}
      <div className="absolute inset-x-0 bottom-0 px-6 pb-10"
        style={{ paddingBottom: 'max(40px, env(safe-area-inset-bottom, 40px))' }}>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={`content-${slide}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Icon badge (slides 1-3) */}
            {s.Icon && (
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(96,165,250,0.22)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <s.Icon className="w-6 h-6 text-white" />
              </div>
            )}

            {/* Slide 0: INKFLOW script */}
            {slide === 0 && (
              <p
                className="text-white mb-2 leading-none"
                style={{ fontFamily: "'Pacifico', cursive", fontSize: 'clamp(3rem, 14vw, 5rem)' }}
              >
                Inkflow
              </p>
            )}

            {/* Title */}
            <h2 className={`font-black text-white leading-tight mb-3 ${slide === 0 ? 'text-xl' : 'text-3xl'}`}
              style={{ letterSpacing: slide === 0 ? '0' : '-0.02em' }}>
              {slide === 0 ? s.sub : s.title}
            </h2>

            {/* Description (slides 1-3) */}
            {slide > 0 && s.sub && (
              <p className="text-base mb-6 leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
                {s.sub}
              </p>
            )}

            {/* Dots */}
            <div className="flex gap-1.5 mb-6">
              {ONBOARD_SLIDES.map((_, i) => (
                <div key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === slide ? 20 : 6,
                    height: 6,
                    background: i === slide ? '#60A5FA' : 'rgba(255,255,255,0.35)',
                  }}
                />
              ))}
            </div>

            {/* CTA button */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={goNext}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black tracking-wide"
              style={{
                background: '#60A5FA',
                color: '#fff',
                boxShadow: '0 8px 32px rgba(96,165,250,0.40)',
                letterSpacing: '0.06em',
              }}
            >
              {slide === total - 1 ? 'COMMENCER' : slide === 0 ? 'COMMENCER' : 'Suivant'}
              {slide < total - 1 && slide > 0 && <ArrowRight className="w-4 h-4" />}
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export const LoginPage: React.FC = () => {
  const [checkEmailMessage, setCheckEmailMessage] = useState(false);
  const [heroSrc, setHeroSrc] = useState(loginHeroImg);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const handleHeroError = () => {
    setHeroSrc((prev) => {
      if (prev === loginHeroImg) return LOGIN_HERO_FALLBACK;
      if (prev === LOGIN_HERO_FALLBACK) return LOGIN_HERO_ABSOLUTE;
      return prev;
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('message') === 'check-email') {
      setCheckEmailMessage(true);
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  return (
    <>
    <AnimatePresence>
      {showOnboarding && (
        <ClientOnboarding onDone={() => { window.location.href = '/client/dashboard'; }} />
      )}
    </AnimatePresence>
    <motion.div
      className="min-h-screen flex bg-white dark:bg-black"
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
      {/* ── LEFT — Login Form ── */}
      <div className="flex-1 flex flex-col min-h-screen">
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
                    Compte créé ! Vérifiez votre boîte mail.
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                    Cliquez sur le lien dans l&apos;email pour activer votre compte.
                  </p>
                </div>
              </div>
            )}

            <LoginForm />

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
