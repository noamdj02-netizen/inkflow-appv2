import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Sparkles } from 'lucide-react';
import { Logo } from '../components/Logo';
import { LoginForm } from '../components/auth/LoginForm';
import { SEO } from '../components/SEO';
import { LANDING_URL, APP_URL } from '../lib/urls';
const LOGIN_HERO_WEBP = '/images/login-hero.webp';
const LOGIN_HERO_FALLBACK = '/images/login-hero.jpg';
const LOGIN_HERO_ABSOLUTE = `${APP_URL}/images/login-hero.jpg`;

/* ── iOS-style notification feed ───────────────────────────── */
const NOTIFS = [
  {
    id: 'n1',
    icon: '🗓️',
    app: 'InkFlow',
    title: 'Nouvelle demande',
    body: 'Lucas B. · Flash serpent — 15 × 10 cm',
    time: "À l'instant",
    dot: '#34d399',
  },
  {
    id: 'n2',
    icon: '💸',
    app: 'InkFlow',
    title: 'Acompte reçu · 80 €',
    body: 'Sarah M. · Papillon aquarelle',
    time: '2 min',
    dot: '#60a5fa',
  },
  {
    id: 'n3',
    icon: '💬',
    app: 'InkFlow',
    title: 'Nouveau message',
    body: '"Merci ! Trop hâte pour vendredi 🙌"',
    time: '5 min',
    dot: '#a78bfa',
  },
  {
    id: 'n4',
    icon: '⏰',
    app: 'InkFlow',
    title: 'RDV dans 1 heure',
    body: 'Antoine R. · Sleeve japonais — Studio A',
    time: '58 min',
    dot: '#fb923c',
  },
  {
    id: 'n5',
    icon: '⭐',
    app: 'InkFlow',
    title: 'Nouvel avis Google',
    body: '"Travail exceptionnel, je recommande !"',
    time: '12 min',
    dot: '#fbbf24',
  },
];

const IOSNotif: React.FC<{ notif: typeof NOTIFS[0]; index: number }> = ({ notif, index }) => (
  <motion.div
    layout
    key={notif.id}
    initial={{ opacity: 0, y: -24, scale: 0.92 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -16, scale: 0.94 }}
    transition={{ type: 'spring', stiffness: 380, damping: 32, delay: index * 0.06 }}
    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl select-none"
    style={{
      background: 'rgba(255,255,255,0.14)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.18)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
    }}
  >
    {/* App icon */}
    <div className="relative flex-shrink-0">
      <div
        className="w-10 h-10 rounded-[11px] flex items-center justify-center text-lg"
        style={{ background: 'rgba(0,0,0,0.35)' }}
      >
        {notif.icon}
      </div>
      <span
        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black/40"
        style={{ background: notif.dot }}
      />
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{notif.app}</span>
        <span className="text-[10px] text-white/40 flex-shrink-0">{notif.time}</span>
      </div>
      <p className="text-sm font-semibold text-white leading-tight truncate">{notif.title}</p>
      <p className="text-xs text-white/60 leading-tight truncate mt-0.5">{notif.body}</p>
    </div>
  </motion.div>
);

type VisibleNotif = typeof NOTIFS[0] & { uid: number };

const ProNotifFeed: React.FC = () => {
  const [visible, setVisible] = useState<VisibleNotif[]>([{ ...NOTIFS[0], uid: 0 }]);
  const counterRef = React.useRef(1);
  const notifIdxRef = React.useRef(1);

  useEffect(() => {
    const t = setInterval(() => {
      const notif = NOTIFS[notifIdxRef.current % NOTIFS.length];
      const uid = counterRef.current++;
      notifIdxRef.current++;
      setVisible((cur) => [{ ...notif, uid }, ...cur].slice(0, 3));
    }, 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="absolute top-8 left-6 right-6 z-20 flex flex-col gap-2.5 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {visible.map((n, i) => (
          <IOSNotif key={n.uid} notif={n} index={i} />
        ))}
      </AnimatePresence>
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
      className="min-h-[100dvh] flex bg-white dark:bg-black"
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
      <div className="flex-1 flex flex-col min-h-[100dvh]">
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

      {/* ── RIGHT — Hero (desktop) : pleine hauteur viewport, pas de bande grise, texte lisible sur dégradé ── */}
      <motion.div
        className="hidden lg:flex lg:w-[520px] xl:w-[600px] h-[100dvh] max-h-[100dvh] min-h-0 flex-shrink-0 relative overflow-hidden bg-zinc-950"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <img
          src={heroSrc}
          alt="Gros plan sur un avant-bras tatoué, la personne consulte son téléphone"
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
          onError={handleHeroError}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" aria-hidden />
        {/* Gradient bottom */}
        <div
          className="absolute inset-x-0 bottom-0 top-1/3 z-[1] bg-gradient-to-t from-black via-black/55 to-transparent pointer-events-none"
          aria-hidden
        />
        {/* iOS notifications */}
        <ProNotifFeed />

        <div className="absolute bottom-0 left-0 right-0 z-10 px-8 sm:px-10 pb-8 sm:pb-10 pt-24 pointer-events-none safe-bottom">
          <h2 className="text-white text-2xl xl:text-3xl font-bold leading-tight mb-2 drop-shadow-md">
            Gérez votre studio.
          </h2>
          <p className="text-white/95 text-base xl:text-lg font-medium leading-snug drop-shadow-md">
            Libérez votre art.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
