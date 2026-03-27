import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Sparkles } from 'lucide-react';
import { Logo } from '../components/Logo';
import { LoginForm } from '../components/auth/LoginForm';
import { SEO } from '../components/SEO';
import { LANDING_URL, APP_URL } from '../lib/urls';
const LOGIN_HERO_WEBP = '/images/login-hero.webp';
const LOGIN_HERO_FALLBACK = '/images/login-hero.jpg';
const LOGIN_HERO_ABSOLUTE = `${APP_URL}/images/login-hero.jpg`;

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
        ogImageAlt="Connexion InkFlow"
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
          alt="Tatoueur au travail dans un studio de tatouage"
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
          onError={handleHeroError}
        />
        {/* Lisibilité du texte : dégradé noir vers le haut */}
        <div
          className="absolute inset-x-0 bottom-0 top-1/3 z-[1] bg-gradient-to-t from-black via-black/55 to-transparent pointer-events-none"
          aria-hidden
        />

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
