import React from 'react';
import { ArrowRight, Star, CheckCircle2, DollarSign, TrendingUp, Calendar, Clock } from 'lucide-react';
import { Logo } from './Logo';
import { TrustedLogos } from './TrustedLogos';
import { InkDropMascot, ArtistMascot } from './Mascots';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[90vh] sm:min-h-[85vh] flex flex-col justify-center pt-28 sm:pt-32 md:pt-36 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background - fond blanc ; grille et mesh très discrets pour garder un peu de texture */}
      <div className="absolute inset-0 -z-10 bg-white">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #0a0a0a 1px, transparent 1px),
              linear-gradient(to bottom, #0a0a0a 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-neutral-100/50 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-neutral-100/40 rounded-full blur-[100px] -z-10" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-neutral-100/30 rounded-full blur-[80px] -z-10" />
      </div>

      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-24 items-center">
          {/* Left content */}
          <div className="relative space-y-8 sm:space-y-10 text-center lg:text-left">
            {/* Mascotte 1 : machine à tatouer près du titre (image de marque InkFlow) */}
            <div className="absolute -top-2 right-2 sm:right-8 lg:right-12 xl:right-16 top-0 opacity-0 animate-fade-in-up stagger-1 z-10" style={{ animationFillMode: 'forwards' }}>
              <InkDropMascot size={64} className="animate-float opacity-90" />
            </div>

            <div
              className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-full border border-neutral-200/80 shadow-sm opacity-0 animate-fade-in-up stagger-0"
              style={{ animationFillMode: 'forwards' }}
            >
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold text-neutral-700">Déjà utilisé par 500+ tatoueurs</span>
            </div>

            <h1 className="relative text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[4.5rem] font-bold leading-[1.05] tracking-tight text-neutral-900">
              Gagnez{' '}
              <span className="relative inline-block">
                <span className="relative z-10">5 heures</span>
                <span className="absolute inset-0 bg-amber-200/60 -z-0" />
              </span>
              <br className="hidden sm:block" />
              {' '}par semaine
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-neutral-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              La plateforme tout-en-un pour tatoueurs : réservations, paiements Stripe, galerie Flash,
              et CRM. Concentrez-vous sur votre art, on s'occupe du reste.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto lg:mx-0 opacity-0 animate-fade-in-up stagger-3" style={{ animationFillMode: 'forwards' }}>
              {[
                'Réservations en ligne 24/7',
                'Acomptes automatiques via Stripe',
                'Votre vitrine et mini site web',
                'CRM client intégré'
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-neutral-700 font-medium text-left">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2 opacity-0 animate-fade-in-up stagger-4" style={{ animationFillMode: 'forwards' }}>
              <a
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 bg-neutral-900 text-white px-8 py-4 rounded-2xl font-semibold text-base hover:bg-neutral-800 transition-all duration-300 shadow-lg shadow-neutral-900/20 hover:shadow-xl hover:shadow-neutral-900/25 hover:-translate-y-0.5"
              >
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-300" />
              </a>
              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 bg-white text-neutral-900 px-8 py-4 rounded-2xl font-semibold text-base border-2 border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all duration-300"
              >
                Voir la démo
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-2 text-sm text-neutral-500 opacity-0 animate-fade-in-up stagger-5" style={{ animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>14 jours d'essai</span>
              </div>
            </div>
          </div>

          {/* Right - Dashboard preview card */}
          <div className="relative mt-8 lg:mt-0 flex justify-center lg:justify-end opacity-0 animate-fade-in-up stagger-6" style={{ animationFillMode: 'forwards' }}>
            {/* Mascotte 2 : flacon d'encre tatouage (style 3D) en bas à gauche de la carte */}
            <div className="absolute bottom-6 left-2 sm:bottom-8 sm:left-8 lg:bottom-12 lg:left-0 z-10">
              <ArtistMascot size={72} className="animate-float opacity-95" style={{ animationDelay: '0.2s' }} />
            </div>

            <div className="relative w-full max-w-xl sm:max-w-2xl lg:max-w-2xl xl:max-w-3xl">
              {/* Glow effect behind card */}
              <div className="absolute -inset-4 bg-neutral-200/30 rounded-[2rem] blur-2xl -z-10" />

              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-neutral-900/10 border border-neutral-200/80 bg-white/95 backdrop-blur-sm">
                {/* Subtle top gradient */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

                <div className="bg-gradient-to-br from-neutral-50 to-white p-6 sm:p-8 lg:p-10">
                  {/* Dashboard Demo Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Logo size="sm" />
                      <div>
                        <div className="text-sm font-bold text-neutral-900">InkFlow</div>
                        <div className="text-xs text-neutral-500 font-medium">Artist Dashboard</div>
                      </div>
                    </div>
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop"
                      alt="Avatar utilisateur"
                      fetchPriority="high"
                      className="w-8 h-8 rounded-full object-cover border border-neutral-200/80"
                    />
                  </div>

                  {/* Dashboard Demo Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* Projet en cours - featured */}
                    <div className="col-span-2 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-100">
                      <div className="flex justify-between items-start mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          En cours • 14:00
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-0.5">Lucas M.</h3>
                      <p className="text-xs sm:text-sm text-neutral-500 mb-4">Bras Japonais - Carpe Koï</p>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-100">
                          <span className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Acompte</span>
                          <span className="text-sm font-bold text-emerald-600">Payé (50€)</span>
                        </div>
                        <div className="flex-1 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-100">
                          <span className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Reste</span>
                          <span className="text-sm font-bold text-neutral-900">350€</span>
                        </div>
                      </div>
                    </div>

                    {/* Revenue card */}
                    <div className="bg-neutral-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-white">
                      <DollarSign className="w-5 h-5 text-white/50 mb-2" />
                      <div className="text-[10px] sm:text-xs text-neutral-400 font-semibold uppercase tracking-wide">Revenue (Aujourd'hui)</div>
                      <div className="text-2xl sm:text-3xl font-bold mt-0.5">450€</div>
                      <div className="text-emerald-400 text-xs flex items-center gap-1 mt-2">
                        <TrendingUp className="w-3.5 h-3.5" /> +120€ vs hier
                      </div>
                    </div>

                    {/* Agenda card */}
                    <div className="bg-indigo-50/80 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-indigo-100/80">
                      <Calendar className="w-5 h-5 text-indigo-600 mb-2" />
                      <div className="text-[10px] sm:text-xs font-bold text-indigo-700 mb-2 uppercase tracking-wide">Agenda</div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 bg-white/90 rounded-lg px-2.5 py-2 border border-indigo-100/80">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-xs font-semibold text-neutral-900">11:00 Lucas M.</span>
                        </div>
                        <div className="flex gap-1">
                          {[12, 13, 14, 15, 16].map((d, i) => (
                            <div
                              key={d}
                              className={`flex-1 min-w-[28px] h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                                i === 1 ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200' : 'bg-white/60 text-indigo-600'
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

              {/* Floating badge */}
              <div className="absolute -top-3 -right-2 sm:-top-4 sm:-right-4 bg-white rounded-xl shadow-lg shadow-neutral-900/10 p-3 border border-neutral-200/80 animate-float">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-neutral-700">Nouveau RDV</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trusted by - logos entreprises */}
        <div className="mt-16 sm:mt-20 pt-12 sm:pt-16 border-t border-neutral-200/60 -mx-4 sm:-mx-6 lg:-mx-8">
          <p className="text-center text-sm font-medium text-neutral-500 mb-8">
            Ils nous font confiance
          </p>
          <TrustedLogos />
        </div>
      </div>
    </section>
  );
};
