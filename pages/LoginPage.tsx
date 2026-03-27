import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Mail, Sparkles,
  Calendar, TrendingUp, Zap, Star,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { LoginForm } from '../components/auth/LoginForm';
import { SEO } from '../components/SEO';
import { LANDING_URL, APP_URL } from '../lib/urls';
const LOGIN_HERO_WEBP = '/images/login-hero.webp';
const LOGIN_HERO_FALLBACK = '/images/login-hero.jpg';
const LOGIN_HERO_ABSOLUTE = `${APP_URL}/images/login-hero.jpg`;

/* ── Pro dashboard preview cards ── */
const PRO_CARDS = [
  {
    id: 'agenda',
    icon: Calendar,
    label: 'Prochain RDV',
    title: 'Antoine R. · Sleeve japonais',
    sub: "Aujourd'hui · 14h00 · Studio A",
    accent: '#ffffff',
    tag: 'Confirmé',
    tagBg: 'rgba(255,255,255,0.12)',
    avatar: { initials: 'AR', grad: ['#0ea5e9', '#38bdf8'] },
  },
  {
    id: 'revenue',
    icon: TrendingUp,
    label: 'Revenus ce mois',
    title: '2 840 €',
    sub: '+18 % vs mois dernier · 23 séances',
    accent: '#c9a96e',
    tag: 'En hausse',
    tagBg: 'rgba(201,169,110,0.18)',
    progress: 0.72,
  },
  {
    id: 'flash',
    icon: Zap,
    label: 'Flash disponible',
    title: '3 designs dispo',
    sub: 'Dragon · Rose · Serpent · 2 demandes',
    accent: '#ffffff',
    tag: 'Nouveau',
    tagBg: 'rgba(255,255,255,0.12)',
  },
  {
    id: 'review',
    icon: Star,
    label: 'Nouvel avis',
    title: '⭐⭐⭐⭐⭐ · Camille D.',
    sub: '"Travail exceptionnel, je recommande !"',
    accent: '#c9a96e',
    tag: '5 étoiles',
    tagBg: 'rgba(201,169,110,0.18)',
  },
];

const ProDashPreview: React.FC = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % PRO_CARDS.length), 3000);
    return () => clearInterval(t);
  }, []);

  const card = PRO_CARDS[active];
  const Icon = card.icon;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-10 py-12 relative select-none">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        aria-hidden
      />

      {/* App header mock */}
      <div className="w-full max-w-[340px] mb-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Logo size="sm" className="rounded-lg" />
            <span className="text-white text-sm font-bold">InkFlow Pro</span>
          </div>
          <div className="flex gap-1">
            {PRO_CARDS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="transition-all"
                style={{
                  width: i === active ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === active ? '#c9a96e' : 'rgba(255,255,255,0.15)',
                }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-[340px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.97 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl p-5 border"
            style={{ background: '#111111', borderColor: '#242424' }}
          >
            <div className="flex items-start justify-between mb-4">
              {'avatar' in card && card.avatar ? (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${card.avatar.grad[0]}, ${card.avatar.grad[1]})` }}
                >
                  {card.avatar.initials}
                </div>
              ) : (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
              )}
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: card.tagBg, color: card.accent }}
              >
                {card.tag}
              </span>
            </div>

            <p className="text-xs text-zinc-500 mb-1">{card.label}</p>
            <p className="text-white font-bold text-lg leading-tight mb-1">{card.title}</p>
            <p className="text-zinc-400 text-sm leading-snug">{card.sub}</p>

            {card.progress !== undefined && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-zinc-600 mb-1.5">
                  <span>Ce mois</span><span>Objectif</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: '#c9a96e' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${card.progress * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Ghost cards below for depth */}
        <div
          className="mx-3 h-3 rounded-b-2xl -mt-1 border-x border-b"
          style={{ background: '#0a0a0a', borderColor: '#1c1c1c' }}
        />
        <div
          className="mx-6 h-2.5 rounded-b-2xl -mt-0.5 border-x border-b"
          style={{ background: '#070707', borderColor: '#161616' }}
        />
      </div>

      {/* Bottom tagline */}
      <div className="mt-10 text-center">
        <p className="text-white text-xl font-bold leading-tight mb-1">
          Gérez votre studio.<br />Libérez votre art.
        </p>
        <p className="text-zinc-500 text-sm">
          Agenda · Clients · Paiements
        </p>
      </div>
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const [checkEmailMessage, setCheckEmailMessage] = useState(false);
  const [heroSrc, setHeroSrc] = useState(LOGIN_HERO_WEBP);
  const handleHeroError = () => {
    setHeroSrc((prev) => {
      if (prev === LOGIN_HERO_WEBP) return LOGIN_HERO_FALLBACK;
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
    <motion.div
      className="h-[100dvh] flex overflow-hidden bg-white dark:bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <SEO
        title="Connexion"
        description="Connectez-vous à votre espace InkFlow : agenda, réservations, clients et paiements Stripe pour votre studio de tatouage."
        canonical="/login"
        keywords="connexion InkFlow, espace tatoueur, login studio tattoo"
        ogImageAlt="Personne avec tatouage regardant son téléphone"
      />
      {/* ── LEFT — Login Form ── */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
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

            <p className="text-center mt-6 text-sm text-zinc-500 dark:text-zinc-400">
              Pas encore de compte ?{' '}
              <a
                href="/signup"
                className="font-semibold text-zinc-900 dark:text-white hover:text-zinc-700 dark:hover:text-zinc-200 underline underline-offset-2"
              >
                Créer un compte
              </a>
            </p>

            <div className="mt-5 pt-5 border-t border-zinc-200 dark:border-zinc-800">
              <a
                href="/client"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500 transition-all"
              >
                <Sparkles className="w-4 h-4" style={{ color: '#c9a96e' }} />
                Accéder à mon espace client
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT — Pro dashboard preview (desktop) ── */}
      <motion.div
        className="hidden lg:flex lg:w-[520px] xl:w-[600px] h-full flex-shrink-0 relative overflow-hidden"
        style={{ background: '#080808', borderLeft: '1px solid #1a1a1a' }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Background hero photo */}
        <img
          src={heroSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ opacity: 0.35, filter: 'brightness(0.8)' }}
          onError={handleHeroError}
        />
        <ProDashPreview />
      </motion.div>
    </motion.div>
  );
};
