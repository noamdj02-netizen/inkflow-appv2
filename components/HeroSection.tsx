import React from 'react';
import { Star, Check, ArrowRight, TrendingUp, User } from 'lucide-react';
import { Logo } from './Logo';

const FEATURES = [
  'Réservations en ligne 24/7',
  'Acomptes automatiques via Stripe',
  'Votre vitrine et mini site web',
  'CRM client intégré',
];

export const HeroSection: React.FC = () => {
  return (
    <section className="relative z-10 bg-[#fafafa] dark:bg-zinc-950 overflow-hidden">
      {/* Grille pointillée subtile */}
      <div
        className="absolute inset-0 opacity-[0.4] dark:opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-28 pb-20 sm:pb-28 lg:pb-36">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Colonne gauche */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-6">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Déjà utilisé par 500+ tatoueurs
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-zinc-900 dark:text-white tracking-tight mb-6">
              Gagnez{' '}
              <span className="bg-amber-300/70 dark:bg-amber-500/30 text-zinc-900 dark:text-white px-1 rounded">
                5 heures
              </span>{' '}
              par semaine
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mb-8 leading-relaxed">
              La plateforme tout-en-un pour tatoueurs : réservations, paiements Stripe, galerie Flash, et CRM.
              Concentrez-vous sur votre art, on s&apos;occupe du reste.
            </p>
            <ul className="space-y-3 mb-8">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" strokeWidth={2.5} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-base hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors active:scale-[0.98]"
              >
                Commencer gratuitement
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/demo"
                className="inline-flex items-center px-6 py-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-semibold text-base hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors active:scale-[0.98]"
              >
                Voir la démo
              </a>
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Check className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
              14 jours d&apos;essai
            </p>
          </div>

          {/* Colonne droite — mockup dashboard Revenus */}
          <div className="flex justify-center lg:justify-end">
            <div
              className="relative w-full max-w-[380px] rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden"
              style={{ transform: 'rotate(3deg)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Logo size="sm" className="rounded-lg" />
                  <span className="font-semibold text-zinc-900 dark:text-white">InkFlow Revenus</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                    <User className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    En direct
                  </span>
                </div>
              </div>
              {/* Bloc principal revenus */}
              <div className="px-5 py-6 bg-zinc-900 dark:bg-zinc-950">
                <div className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">CE MOIS</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">2340€</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-sm text-emerald-500">
                  <TrendingUp className="w-4 h-4" />
                  <span>+18% vs mois dernier</span>
                </div>
              </div>
              {/* Cartes jour / semaine */}
              <div className="p-4 flex gap-3">
                <div className="flex-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                    Aujourd&apos;hui
                  </div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-white">450€</div>
                </div>
                <div className="flex-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                    Cette semaine
                  </div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-white">1120€</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
