import React, { useState } from 'react';
import { Check, Zap } from 'lucide-react';

export const PricingSection: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Solo',
      description: 'Pour les tatoueurs indépendants',
      priceMonthly: 29,
      priceAnnual: 24,
      features: [
        'Réservations illimitées',
        'Paiements Stripe',
        'Galerie Flash',
        '100 clients CRM',
        'Support email',
        'Application mobile'
      ],
      cta: 'Commencer',
      popular: false
    },
    {
      name: 'Studio',
      description: 'Pour les studios avec plusieurs artistes',
      priceMonthly: 79,
      priceAnnual: 65,
      features: [
        'Tout du plan Solo',
        '3 artistes inclus',
        'Clients CRM illimités',
        'Multi-calendriers',
        'Statistiques avancées',
        'Support prioritaire',
        'Formation personnalisée',
        'API access'
      ],
      cta: 'Commencer',
      popular: true
    },
    {
      name: 'Enterprise',
      description: 'Pour les grands studios et franchises',
      priceMonthly: null,
      priceAnnual: null,
      features: [
        'Tout du plan Studio',
        'Artistes illimités',
        'Multi-studios',
        'White-label',
        'Dédiée account manager',
        'SLA garanti',
        'Formation sur site',
        'Intégrations custom'
      ],
      cta: 'Nous contacter',
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Un tarif simple et transparent
          </h2>
          <p className="text-xl text-neutral-600 mb-8">
            Choisissez le plan qui correspond à votre activité
          </p>

          <div className="inline-flex items-center gap-4 bg-white p-2 rounded-xl border border-neutral-200">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                !isAnnual
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all relative ${
                isAnnual
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Annuel
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-3xl p-8 ${
                plan.popular
                  ? 'bg-neutral-900 text-white shadow-2xl scale-105 border-2 border-neutral-800'
                  : 'bg-white border-2 border-neutral-200 hover:border-neutral-900 transition-all'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    Plus populaire
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-neutral-900'}`}>
                  {plan.name}
                </h3>
                <p className={plan.popular ? 'text-neutral-300' : 'text-neutral-600'}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                {plan.priceMonthly ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">
                        €{isAnnual ? plan.priceAnnual : plan.priceMonthly}
                      </span>
                      <span className={plan.popular ? 'text-neutral-400' : 'text-neutral-600'}>
                        /mois
                      </span>
                    </div>
                    {isAnnual && plan.priceAnnual && (
                      <div className={`text-sm mt-2 ${plan.popular ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Facturé €{plan.priceAnnual * 12} par an
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-3xl font-bold">Sur mesure</div>
                )}
              </div>

              <a
                href="/signup"
                className={`block w-full text-center py-4 rounded-xl font-semibold mb-8 transition-all ${
                  plan.popular
                    ? 'bg-white text-neutral-900 hover:bg-neutral-100'
                    : 'bg-neutral-900 text-white hover:bg-neutral-800'
                }`}
              >
                {plan.cta}
              </a>

              <div className="space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      plan.popular ? 'text-green-400' : 'text-green-600'
                    }`} />
                    <span className={`text-sm ${plan.popular ? 'text-neutral-200' : 'text-neutral-700'}`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center space-y-4">
          <div className="flex justify-center items-center gap-6 flex-wrap text-sm text-neutral-600">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span>14 jours d'essai gratuit</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span>Annulation à tout moment</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span>Pas d'engagement</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
