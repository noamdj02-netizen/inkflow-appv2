import React from 'react';
import { ArrowRight, Star } from 'lucide-react';

export const CTAFinal: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 mb-8">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <span className="text-sm font-semibold">4.9/5 sur 200+ avis</span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          Prêt à gagner 5 heures par semaine ?
        </h2>

        <p className="text-xl text-neutral-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          Rejoignez 500+ tatoueurs qui ont déjà automatisé leur gestion et se concentrent sur leur art.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <a
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 bg-white text-neutral-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-neutral-100 transition-all shadow-xl"
          >
            Commencer gratuitement
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#pricing"
            className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all"
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
            <span>Pas de carte bancaire</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>Annulation à tout moment</span>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
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
