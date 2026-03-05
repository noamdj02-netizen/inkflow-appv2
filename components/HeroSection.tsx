import React from 'react';
import { Star, Check, ArrowRight } from 'lucide-react';

const FEATURES = [
  'Réservations en ligne 24/7',
  'Acomptes automatiques via Stripe',
  'Votre vitrine et mini site web',
  'CRM client intégré',
];

export const HeroSection: React.FC = () => {
  return (
    <section className="relative z-10 bg-[#f5f5f7] dark:bg-zinc-950 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(5rem+env(safe-area-inset-top))] sm:pt-24 lg:pt-28 pb-12 sm:pb-20 lg:pb-36">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-center">
          {/* Colonne gauche — titre + CTA en premier sur mobile */}
          <div className="order-1 lg:order-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/90 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm mb-4 sm:mb-6">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Déjà utilisé par 500+ tatoueurs
              </span>
            </div>
            <h1 className="text-2xl min-[375px]:text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-zinc-900 dark:text-white tracking-tight mb-4 sm:mb-6 leading-tight">
              Gagnez{' '}
              <span className="bg-amber-300/80 dark:bg-amber-500/40 text-zinc-900 dark:text-white px-1.5 rounded">
                5 heures
              </span>{' '}
              par semaine
            </h1>
            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto lg:mx-0 mb-6 sm:mb-8 leading-relaxed">
              La plateforme tout-en-un pour tatoueurs : réservations, paiements Stripe, galerie Flash, et CRM.
              Concentrez-vous sur votre art, on s&apos;occupe du reste.
            </p>
            <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 max-w-md mx-auto lg:mx-0">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300 text-sm sm:text-base">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0" strokeWidth={2.5} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <a
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 sm:px-6 sm:py-3.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm sm:text-base hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors active:scale-[0.98] min-h-[48px] touch-manipulation"
              >
                Commencer gratuitement
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/demo"
                className="inline-flex items-center justify-center px-5 py-3.5 sm:px-6 sm:py-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-semibold text-sm sm:text-base hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors active:scale-[0.98] min-h-[48px] touch-manipulation"
              >
                Voir la démo
              </a>
            </div>
            <p className="mt-4 flex items-center justify-center lg:justify-start gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Check className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
              14 jours d&apos;essai
            </p>
          </div>

          {/* Colonne droite — mockup téléphone, en dessous du titre + CTA sur mobile */}
          <div className="order-2 lg:order-2 flex justify-center lg:justify-end overflow-hidden">
            <div className="relative -rotate-3 sm:-rotate-6 scale-90 sm:scale-100 origin-center">
              <div className="relative w-[200px] min-[375px]:w-[220px] sm:w-[260px] lg:w-[300px] aspect-[9/19] rounded-[2rem] sm:rounded-[2.5rem] bg-zinc-900 dark:bg-zinc-950 p-2 sm:p-2.5 shadow-2xl shadow-zinc-900/30 sm:shadow-zinc-900/40 ring-2 sm:ring-4 ring-zinc-800/60">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-4 sm:h-5 bg-zinc-900 rounded-b-lg sm:rounded-b-xl z-10" />
                <div className="w-full h-full rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-white">
                  <img
                    src="/images/hero-dashboard-mockup.png"
                    alt="Dashboard InkFlow — Accueil"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
