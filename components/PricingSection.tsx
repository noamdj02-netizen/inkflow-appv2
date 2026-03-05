import React, { useState } from 'react';
import { Check, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { STRIPE_PAYMENT_LINKS } from '../lib/stripePaymentLinks';
import { useIntersectionAnimation } from '../hooks/useIntersectionAnimation';

export const PricingSection: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const { isAuthenticated } = useAuth();
  const { ref, isVisible } = useIntersectionAnimation(0.08);

  const plans = [
    {
      id: 'starter' as const,
      name: 'Starter',
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
      id: 'pro' as const,
      name: 'Pro',
      description: 'Pour les artistes qui veulent aller plus loin',
      priceMonthly: 49,
      priceAnnual: 39,
      features: [
        'Tout du plan Starter',
        '2 artistes inclus',
        '200 clients CRM',
        'Multi-calendriers',
        'Statistiques avancées',
        'Support prioritaire'
      ],
      cta: 'Commencer',
      popular: true
    },
    {
      id: 'studio' as const,
      name: 'Studio',
      description: 'Pour les studios avec plusieurs artistes',
      priceMonthly: 79,
      priceAnnual: 65,
      features: [
        'Tout du plan Pro',
        '3 artistes inclus',
        'Clients CRM illimités',
        'Formation personnalisée',
        'API access'
      ],
      cta: 'Commencer',
      popular: false
    }
  ];

  const getPlanHref = (plan: (typeof plans)[0]) => {
    if (plan.id in STRIPE_PAYMENT_LINKS) {
      return STRIPE_PAYMENT_LINKS[plan.id as keyof typeof STRIPE_PAYMENT_LINKS];
    }
    if (isAuthenticated) {
      return `/dashboard?subscribe=${plan.id}&interval=${isAnnual ? 'annual' : 'monthly'}`;
    }
    return `/signup?plan=${plan.id}&interval=${isAnnual ? 'annual' : 'monthly'}`;
  };

  return (
    <section id="pricing" className={`py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white text-neutral-900 transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div ref={ref} className={`max-w-7xl mx-auto animate-on-scroll ${isVisible ? 'is-visible' : ''}`}>
        <div className="text-center mb-10 sm:mb-20">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 px-2 tracking-tight">
            Un tarif simple et transparent
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-neutral-600 mb-8 sm:mb-10 px-2 max-w-2xl mx-auto">
            Choisissez le plan qui correspond à votre activité
          </p>

          <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-neutral-100 border border-neutral-200/80" role="group" aria-label="Choisir la fréquence de facturation">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 sm:px-6 py-2.5 min-h-[44px] rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 ${
                !isAnnual
                  ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200/80'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              aria-pressed={!isAnnual}
            >
              Mensuel
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 sm:px-6 py-2.5 min-h-[44px] rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 relative ${
                isAnnual
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              aria-pressed={isAnnual}
            >
              Annuel
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-10 sm:mb-12">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 ${
                plan.popular
                  ? 'bg-neutral-900 text-white shadow-2xl shadow-neutral-900/20 md:scale-[1.02] border border-neutral-800 order-first md:order-none'
                  : 'bg-white border border-neutral-200/80 hover:border-neutral-300 hover:shadow-xl hover:shadow-neutral-900/5 transition-all duration-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-white/10 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 border border-white/20">
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
                      <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : 'text-neutral-900'}`}>
                        €{isAnnual ? plan.priceAnnual : plan.priceMonthly}
                      </span>
                      <span className={plan.popular ? 'text-neutral-400' : 'text-neutral-600 dark:text-neutral-500'}>
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
                href={getPlanHref(plan)}
                {...(getPlanHref(plan).startsWith('http') && {
                  target: '_blank',
                  rel: 'noopener noreferrer',
                })}
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
                      plan.popular ? 'text-blue-400' : 'text-blue-600 dark:text-blue-500'
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
              <Check className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              <span>14 jours d'essai gratuit</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              <span>Annulation à tout moment</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              <span>Pas d'engagement</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
