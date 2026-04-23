import React from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { LANDING_PRICING_URL } from '../lib/urls';

export const CTAFinal: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-neutral-900 text-white relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[400px] bg-white/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-white/5 rounded-full blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2.5 rounded-full border border-white/10 mb-8">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-sm font-semibold">4.9/5 sur 200+ avis</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight px-2 tracking-tight">
          Prêt à gagner 5 heures par semaine ?
        </h2>

        <p className="text-base sm:text-lg md:text-xl text-neutral-300 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
          Rejoignez 500+ tatoueurs qui ont déjà automatisé leur gestion et se concentrent sur leur art.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <a
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 bg-white text-neutral-900 px-8 py-4 rounded-2xl font-semibold text-base hover:bg-neutral-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
          >
            Commencer gratuitement
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href={LANDING_PRICING_URL}
            className="inline-flex items-center justify-center gap-2 bg-white/5 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-semibold text-base border border-white/10 hover:bg-white/10 transition-all duration-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            Voir les tarifs
          </a>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-neutral-400">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>Essai gratuit 14 jours</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>Annulation à tout moment</span>
          </div>
        </div>

        <div className="mt-16 pt-10 border-t border-white/10">
          <p className="text-neutral-400 mb-4">Ils nous font déjà confiance</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {['Ink & Soul', 'Dark Art Studio', 'Electric Tattoo', 'Urban Ink', 'Noir Tattoo'].map((studio, i) => (
              <div key={i} className="text-sm font-semibold tracking-wider">
                {studio}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
