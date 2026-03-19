import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail } from 'lucide-react';
import { Logo } from '../components/Logo';
import { LoginForm } from '../components/auth/LoginForm';
import { SEO } from '../components/SEO';
import { LANDING_URL, APP_URL } from '../lib/urls';
import loginHeroImg from '../src/assets/login-hero.jpg';

const LOGIN_HERO_FALLBACK = '/images/login-hero.jpg';
const LOGIN_HERO_ABSOLUTE = `${APP_URL}/images/login-hero.jpg`;

export const LoginPage: React.FC = () => {
  const [checkEmailMessage, setCheckEmailMessage] = useState(false);
  const [heroSrc, setHeroSrc] = useState(loginHeroImg);
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
        {/* Photo étirée pleine hauteur, ancrée en bas, responsive */}
        <img
          src={heroSrc}
          alt="Tatoueur"
          className="absolute inset-0 w-full min-h-full object-cover object-bottom"
          loading="eager"
          fetchPriority="high"
          onError={handleHeroError}
        />

        {/* Texte en overlay par-dessus la photo */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-10 pb-10 pt-16 pointer-events-none">
          <h2 className="text-white text-2xl font-bold leading-snug mb-1 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
            Gérez votre studio.
          </h2>
          <p className="text-white text-base [text-shadow:0_2px_6px_rgba(0,0,0,0.8)]">Libérez votre art.</p>
        </div>
      </motion.div>
    </motion.div>
  );
};
