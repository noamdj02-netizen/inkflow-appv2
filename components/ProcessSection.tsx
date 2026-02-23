import React from 'react';
import { UserPlus, Settings, Rocket, CheckCircle2 } from 'lucide-react';
import { useIntersectionAnimation } from '../hooks/useIntersectionAnimation';

export const ProcessSection: React.FC = () => {
  const { ref, isVisible } = useIntersectionAnimation(0.08);
  const steps = [
    {
      icon: UserPlus,
      title: 'Créez votre compte',
      description: 'Inscription en 2 minutes. Aucune carte bancaire requise pour l\'essai.',
      duration: '2 min'
    },
    {
      icon: Settings,
      title: 'Configurez votre studio',
      description: 'Ajoutez vos horaires, services, et connectez Stripe pour les paiements.',
      duration: '10 min'
    },
    {
      icon: Rocket,
      title: 'Partagez votre lien',
      description: 'Envoyez votre lien de réservation à vos clients sur Instagram, WhatsApp...',
      duration: '1 min'
    },
    {
      icon: CheckCircle2,
      title: 'Recevez vos réservations',
      description: 'Vos clients réservent 24/7. Vous êtes notifié et les acomptes arrivent automatiquement.',
      duration: 'Automatique'
    }
  ];

  return (
    <section id="process" className={`py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-neutral-50/50 transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div ref={ref} className={`max-w-7xl mx-auto animate-on-scroll ${isVisible ? 'is-visible' : ''}`}>
        <div className="text-center mb-12 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 px-2 tracking-tight">
            Prêt en moins de 15 minutes
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto px-2">
            De l'inscription à votre première réservation, tout est simple et rapide
          </p>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-neutral-200" style={{ width: 'calc(100% - 8rem)', marginLeft: '4rem' }} />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 bg-neutral-900 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-neutral-900/20">
                      <Icon className="w-10 h-10 text-white" />
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-white border-2 border-neutral-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold">{index + 1}</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="inline-block bg-neutral-100 px-3 py-1 rounded-full text-sm font-semibold text-neutral-600 mb-4">
                        {step.duration}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-neutral-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-16 sm:mt-20">
          <a
            href="/signup"
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-8 py-4 rounded-2xl font-semibold text-base hover:bg-neutral-800 transition-all duration-300 shadow-lg shadow-neutral-900/20 hover:shadow-xl hover:shadow-neutral-900/25 hover:-translate-y-0.5"
          >
            Commencer maintenant
          </a>
          <p className="text-sm text-neutral-500 mt-4">
            Essai gratuit de 14 jours • Pas de carte bancaire requise
          </p>
        </div>
      </div>
    </section>
  );
};
