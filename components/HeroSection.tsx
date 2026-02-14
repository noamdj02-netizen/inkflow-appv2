import React from 'react';
import { ArrowRight, Star, CheckCircle2, DollarSign, TrendingUp, Calendar, Clock } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neutral-200 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neutral-300 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-neutral-100 px-4 py-2 rounded-full border border-neutral-200">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">Déjà utilisé par 500+ tatoueurs</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              Gagnez <span className="text-neutral-600">5 heures</span> par semaine
            </h1>

            <p className="text-xl text-neutral-600 leading-relaxed">
              La plateforme tout-en-un pour tatoueurs : réservations, paiements Stripe, galerie Flash,
              et CRM. Concentrez-vous sur votre art, on s'occupe du reste.
            </p>

            <div className="space-y-3">
              {[
                'Réservations en ligne 24/7',
                'Acomptes automatiques via Stripe',
                'Galerie Flash personnalisable',
                'CRM client intégré'
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-neutral-700 font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 bg-neutral-900 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-neutral-800 transition-all shadow-lg hover:shadow-xl"
              >
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 bg-white text-neutral-900 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-neutral-200 hover:border-neutral-900 transition-all"
              >
                Voir la démo
              </a>
            </div>

            <div className="flex items-center gap-6 pt-4 text-sm text-neutral-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Pas de carte bancaire requise</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>14 jours d'essai</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-200">
              <div className="bg-gradient-to-br from-neutral-100 to-neutral-50 p-6">
                {/* Dashboard Demo Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center font-black text-white text-sm">IF.</div>
                    <div>
                      <div className="text-sm font-bold text-neutral-900">Inkflow</div>
                      <div className="text-[10px] text-neutral-500 font-medium">Artist Dashboard</div>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-neutral-200" />
                </div>

                {/* Dashboard Demo Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Projet en cours */}
                  <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                        En cours • 14:00
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900">Lucas M.</h3>
                    <p className="text-xs text-neutral-500 mb-3">Bras Japonais - Carpe Koï</p>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-neutral-50 rounded-lg px-2 py-1.5">
                        <span className="block text-[9px] font-bold text-neutral-400 uppercase">Acompte</span>
                        <span className="text-xs font-bold text-green-600">Payé (50€)</span>
                      </div>
                      <div className="flex-1 bg-neutral-50 rounded-lg px-2 py-1.5">
                        <span className="block text-[9px] font-bold text-neutral-400 uppercase">Reste</span>
                        <span className="text-xs font-bold text-neutral-900">350€</span>
                      </div>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="bg-neutral-900 rounded-xl p-4 text-white">
                    <DollarSign className="w-5 h-5 text-white/60 mb-1" />
                    <div className="text-[10px] text-neutral-400 font-semibold">Revenue (Aujourd'hui)</div>
                    <div className="text-2xl font-bold">450€</div>
                    <div className="text-green-400 text-[10px] flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" /> +120€ vs hier
                    </div>
                  </div>

                  {/* Agenda */}
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    <Calendar className="w-5 h-5 text-indigo-600 mb-1" />
                    <div className="text-[10px] font-bold text-indigo-700 mb-2">Agenda</div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 bg-white/80 rounded-lg px-2 py-1.5 border border-indigo-100">
                        <Clock className="w-3 h-3 text-indigo-600" />
                        <span className="text-xs font-semibold text-neutral-900">11:00 Lucas M.</span>
                      </div>
                      <div className="flex gap-1">
                        {[12, 13, 14, 15, 16].map((d, i) => (
                          <div
                            key={d}
                            className={`w-7 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                              i === 1 ? 'bg-white text-indigo-700 shadow border border-indigo-200' : 'bg-white/60 text-indigo-600'
                            }`}
                          >
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-3 border border-neutral-200 animate-bounce">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs font-semibold">Nouveau RDV</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
