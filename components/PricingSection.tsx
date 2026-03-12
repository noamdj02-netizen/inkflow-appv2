import React, { useState } from 'react';
import { Check, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { STRIPE_PAYMENT_LINKS } from '../lib/stripePaymentLinks';
import { useIntersectionAnimation } from '../hooks/useIntersectionAnimation';

const PRO_PLAN_PRICE = 29;

export const PricingSection: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [rdvParSemaine, setRdvParSemaine] = useState(8);
  const [prixMoyen, setPrixMoyen] = useState(150);
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { ref, isVisible } = useIntersectionAnimation(0.08);

  const rdvParMois = rdvParSemaine * 4;
  const gainTemps = rdvParSemaine * 0.5;
  const noShowEvites = Math.round(rdvParMois * 0.08);
  const gainNoShow = noShowEvites * (prixMoyen * 0.3);
  const roi = Math.round(((gainTemps * 20 + gainNoShow) / PRO_PLAN_PRICE) * 10) / 10;

  const plans = [
    {
      id: 'starter' as const,
      name: 'Starter',
      descriptionKey: 'pricing.starterDesc',
      priceMonthly: 29,
      priceAnnual: 24,
      featureKeys: ['pricing.f1', 'pricing.f2', 'pricing.f3', 'pricing.f4', 'pricing.f5', 'pricing.f6'],
      ctaKey: 'pricing.start',
      popular: false
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      descriptionKey: 'pricing.proDesc',
      priceMonthly: 49,
      priceAnnual: 39,
      featureKeys: ['pricing.f7', 'pricing.f8', 'pricing.f9', 'pricing.f10', 'pricing.f11', 'pricing.f12'],
      ctaKey: 'pricing.start',
      popular: true
    },
    {
      id: 'studio' as const,
      name: 'Studio',
      descriptionKey: 'pricing.studioDesc',
      priceMonthly: 79,
      priceAnnual: 65,
      featureKeys: ['pricing.f13', 'pricing.f14', 'pricing.f15', 'pricing.f16', 'pricing.f17'],
      ctaKey: 'pricing.start',
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
            {t('pricing.title')}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-neutral-600 mb-8 sm:mb-10 px-2 max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>

          {/* Calculateur ROI */}
          <div className="mb-12 sm:mb-16 p-6 sm:p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left max-w-2xl mx-auto">
            <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              Calculez votre retour sur investissement
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Rendez-vous par semaine : <strong>{rdvParSemaine}</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={rdvParSemaine}
                  onChange={(e) => setRdvParSemaine(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none bg-zinc-200 dark:bg-zinc-700 accent-blue-600"
                  aria-valuemin={1}
                  aria-valuemax={30}
                  aria-valuenow={rdvParSemaine}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Prix moyen par tatouage : <strong>{prixMoyen}€</strong>
                </label>
                <input
                  type="range"
                  min={50}
                  max={500}
                  value={prixMoyen}
                  onChange={(e) => setPrixMoyen(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none bg-zinc-200 dark:bg-zinc-700 accent-blue-600"
                  aria-valuemin={50}
                  aria-valuemax={500}
                  aria-valuenow={prixMoyen}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase mb-1">Temps gagné</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{gainTemps}h <span className="text-sm font-normal text-zinc-500">/semaine</span></p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">sur l&apos;administratif</p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase mb-1">No-shows évités</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{noShowEvites} <span className="text-sm font-normal text-zinc-500">/mois</span></p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">grâce aux acomptes auto</p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase mb-1">Retour sur investissement</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{roi}x</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">le prix du plan Pro</p>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700 text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Pour seulement <strong className="text-zinc-900 dark:text-zinc-100">{PRO_PLAN_PRICE}€/mois</strong>, Inkflow vous rapporte en moyenne <strong className="text-blue-600 dark:text-blue-400">{roi}x</strong> son coût.
              </p>
              <a
                href="/signup?plan=pro"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Démarrer l&apos;essai gratuit →
              </a>
            </div>
          </div>

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
              {t('pricing.monthly')}
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
              {t('pricing.annual')}
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
                    {t('pricing.mostPopular')}
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-neutral-900'}`}>
                  {plan.name}
                </h3>
                <p className={plan.popular ? 'text-neutral-300' : 'text-neutral-600'}>
                  {t(plan.descriptionKey)}
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
                        {t('pricing.perMonth')}
                      </span>
                    </div>
                    {isAnnual && plan.priceAnnual && (
                      <div className={`text-sm mt-2 ${plan.popular ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        {t('pricing.billed').replace('{amount}', String(plan.priceAnnual * 12))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-3xl font-bold">{t('pricing.custom')}</div>
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
                {t(plan.ctaKey)}
              </a>

              <div className="space-y-4">
                {plan.featureKeys.map((key, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      plan.popular ? 'text-blue-400' : 'text-blue-600 dark:text-blue-500'
                    }`} />
                    <span className={`text-sm ${plan.popular ? 'text-neutral-200' : 'text-neutral-700'}`}>
                      {t(key)}
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
              <span>{t('pricing.trial14')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              <span>{t('pricing.cancelAnytime')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              <span>{t('pricing.noCommitment')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
