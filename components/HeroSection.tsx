import React from 'react';
import { ArrowRight, Star, CheckCircle2 } from 'lucide-react';
import { Logo } from './Logo';
import { TrustedLogos } from './TrustedLogos';
import { ArtistMascot } from './Mascots';
import { DashboardDemoVideo } from './landing/DashboardDemoVideo';

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
                href="/demo"
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

          {/* Right - Démo vidéo animée */}
          <div className="relative mt-8 lg:mt-0 flex justify-center lg:justify-end opacity-0 animate-fade-in-up stagger-6" style={{ animationFillMode: 'forwards' }}>
            <div className="absolute bottom-6 left-2 sm:bottom-8 sm:left-8 lg:bottom-12 lg:left-0 z-10">
              <ArtistMascot size={72} className="animate-float opacity-95" style={{ animationDelay: '0.2s' }} />
            </div>
            <DashboardDemoVideo />
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
