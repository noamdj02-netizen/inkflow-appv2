import React from 'react';
import { UserPlus, Settings, Rocket, CheckCircle2 } from 'lucide-react';

export const ProcessSection: React.FC = () => {
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
    <section id="process" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Prêt en moins de 15 minutes
          </h2>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            De l'inscription à votre première réservation, tout est simple et rapide
          </p>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-neutral-200" style={{ width: 'calc(100% - 8rem)', marginLeft: '4rem' }} />

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative z-10 w-24 h-24 bg-neutral-900 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
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

        <div className="text-center mt-16">
          <a
            href="/signup"
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-neutral-800 transition-all shadow-lg hover:shadow-xl"
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
