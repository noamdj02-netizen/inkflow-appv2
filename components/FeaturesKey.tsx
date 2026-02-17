import React from 'react';

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
  return (
    <section id="fonctionnalites-cles" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Tout pour gérer votre studio
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto">
            Les outils essentiels pour piloter votre activité de tatoueur
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {CARDS.map((card) => (
            <div
              key={card.id}
              className="bg-gray-50 rounded-3xl p-6 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="overflow-hidden rounded-2xl mb-6">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-auto object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">{card.title}</h3>
              <p className="text-neutral-600 text-sm sm:text-base">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
