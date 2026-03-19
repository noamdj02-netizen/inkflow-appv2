import React, { useEffect, useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { Logo } from '../components/Logo';
import { LoginForm } from '../components/auth/LoginForm';
import { LANDING_URL } from '../lib/urls';

export const LoginPage: React.FC = () => {
  const [checkEmailMessage, setCheckEmailMessage] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('message') === 'check-email') {
      setCheckEmailMessage(true);
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-black">

      {/* ── LEFT — Form panel ── */}
      <div className="flex flex-col w-full lg:w-[46%] xl:w-[42%] min-h-screen px-8 sm:px-12 xl:px-16 py-10 safe-top safe-bottom">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-16">
          <a
            href={LANDING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 transition-colors text-sm min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </a>

          <div className="flex items-center gap-2">
            <Logo className="invert opacity-90 w-6 h-6" />
            <span className="text-sm font-semibold text-zinc-200 tracking-tight">InkFlow</span>
          </div>
        </div>

        {/* Form zone */}
        <div className="flex-1 flex flex-col justify-center w-full max-w-[360px] mx-auto">

          {/* Heading */}
          <div className="mb-10">
            <h1 className="text-[2.6rem] sm:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-3">
              Bon retour.
            </h1>
            <p className="text-zinc-500 text-[15px]">
              Connectez-vous à votre espace tatoueur.
            </p>
          </div>

          {/* Email verification banner */}
          {checkEmailMessage && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-950/50 border border-emerald-800/60 mb-6">
              <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-300">
                  Compte créé — vérifiez votre boîte mail.
                </p>
                <p className="text-xs text-emerald-500 mt-0.5">
                  Cliquez sur le lien reçu pour activer votre compte.
                </p>
              </div>
            </div>
          )}

          <LoginForm />
        </div>

        {/* Bottom */}
        <p className="text-center text-sm text-zinc-600 mt-10">
          Pas encore de compte ?{' '}
          <a
            href="/signup"
            className="text-zinc-300 font-medium hover:text-white transition-colors"
          >
            Créer un compte
          </a>
        </p>
      </div>

      {/* ── RIGHT — Hero photo ── */}
      {/* → Remplace /images/login-hero.jpg par ta photo dans public/images/ */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        <img
          src="/images/login-hero.jpg"
          alt="Tatoueur InkFlow"
          className="absolute inset-0 w-full h-full object-cover object-center"
          fetchPriority="high"
          onError={(e) => {
            // Fallback Unsplash tant que la photo locale n'est pas uploadée
            const t = e.currentTarget;
            if (!t.src.includes('unsplash')) {
              t.src = 'https://images.unsplash.com/photo-1590246814883-55516d489e9a?w=1200&q=85&auto=format&fit=crop';
            }
          }}
        />
        {/* Left-edge gradient so form blends into photo */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent" />
        {/* Bottom gradient + tagline */}
        <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10">
          <p className="text-white text-2xl font-bold tracking-tight leading-snug">
            Gérez votre studio.<br />
            <span className="text-zinc-400 font-normal">Libérez votre art.</span>
          </p>
        </div>
      </div>

    </div>
  );
};
