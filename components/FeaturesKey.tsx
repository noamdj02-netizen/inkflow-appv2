import React from 'react';
import { useIntersectionAnimation } from '../hooks/useIntersectionAnimation';

const CARDS = [
  {
    id: 'dashboard',
    title: 'Pilotage Global',
    description: "Suivez votre chiffre d'affaires et vos statistiques en temps réel.",
    image: '/images/feature-dashboard.png',
  },
  {
    id: 'agenda',
    title: 'Agenda Automatisé',
    description: 'Fini les lapins. Réservation 24/7 et sécurisation par acompte.',
    image: '/images/feature-agenda.png',
  },
  {
    id: 'crm',
    title: 'CRM Artiste',
    description: "L'historique complet de vos clients et leurs projets dans votre poche.",
    image: '/images/feature-crm.png',
  },
];

export const FeaturesKey: React.FC = () => {
  const { ref, isVisible } = useIntersectionAnimation(0.08);
  return (
    <section id="fonctionnalites-cles" className={`py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-zinc-900/95 transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div ref={ref} className={`max-w-7xl mx-auto animate-on-scroll ${isVisible ? 'is-visible' : ''}`}>
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 tracking-tight text-white">
            Tout pour gérer votre studio
          </h2>
          <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto">
            Les outils essentiels pour piloter votre activité de tatoueur
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {CARDS.map((card) => (
            <div
              key={card.id}
              className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-lg overflow-hidden hover:shadow-xl hover:border-zinc-600/50 transition-all duration-300"
            >
              <div className="overflow-hidden rounded-2xl mb-6">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">{card.title}</h3>
              <p className="text-zinc-400 text-sm sm:text-base">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
