import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PricingBentoGrid } from '@/components/ui/bento';
import { PLAN_CONFIG, PLAN_DISPLAY_NAMES, PLAN_TARGET_PRICE_EUR } from '@/lib/subscriptionPlans';
import {
  LandingMotionItem,
  LandingMotionReveal,
  LandingMotionStagger,
} from './landing/landingMotion';

type PlanId = 'solo' | 'pro' | 'studio';

const LANDING_PLAN_IDS: PlanId[] = ['solo', 'pro', 'studio'];

type ComparisonRow = {
  labelKey: string | Record<PlanId, string>;
  included: Record<PlanId, boolean>;
};

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    labelKey: 'pricing.f1',
    included: { solo: true, pro: true, studio: true },
  },
  {
    labelKey: 'pricing.f2',
    included: { solo: true, pro: true, studio: true },
  },
  {
    labelKey: 'pricing.f3',
    included: { solo: true, pro: true, studio: true },
  },
  {
    labelKey: 'pricing.f6',
    included: { solo: true, pro: true, studio: true },
  },
  {
    labelKey: 'pricing.f18',
    included: { solo: true, pro: true, studio: true },
  },
  {
    labelKey: { solo: 'pricing.f4', pro: 'pricing.f9', studio: 'pricing.f15' },
    included: { solo: true, pro: true, studio: true },
  },
  {
    labelKey: 'pricing.f5',
    included: { solo: true, pro: true, studio: true },
  },
  {
    labelKey: 'pricing.f10',
    included: { solo: false, pro: true, studio: true },
  },
  {
    labelKey: 'pricing.f11',
    included: { solo: false, pro: true, studio: true },
  },
  {
    labelKey: 'pricing.f19',
    included: { solo: false, pro: true, studio: true },
  },
  {
    labelKey: 'pricing.f12',
    included: { solo: false, pro: true, studio: true },
  },
  {
    labelKey: 'pricing.f20',
    included: { solo: false, pro: false, studio: true },
  },
  {
    labelKey: 'pricing.f17',
    included: { solo: false, pro: false, studio: true },
  },
];

function rowLabel(row: ComparisonRow, planId: PlanId, t: (key: string) => string): string {
  if (typeof row.labelKey === 'string') return t(row.labelKey);
  return t(row.labelKey[planId]);
}

export const PricingSection: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const plans = LANDING_PLAN_IDS.map((id) => {
    const pricing = PLAN_TARGET_PRICE_EUR[id];
    const monthly = pricing.monthly ?? 0;
    const annual = pricing.annualMonthlyEquiv ?? monthly;
    return {
      id,
      name: PLAN_CONFIG[id].name || PLAN_DISPLAY_NAMES[id],
      descriptionKey:
        id === 'solo'
          ? 'pricing.soloDesc'
          : id === 'pro'
            ? 'pricing.proDesc'
            : 'pricing.studioDesc',
      priceMonthly: monthly,
      priceAnnual: annual,
      popular: id === 'pro',
    };
  });

  const getPlanHref = (planId: PlanId) => {
    if (isAuthenticated) {
      return `/dashboard?subscribe=${planId}&interval=${isAnnual ? 'annual' : 'monthly'}`;
    }
    return `/signup?plan=${planId}&interval=${isAnnual ? 'annual' : 'monthly'}`;
  };

  return (
    <section
      id="pricing"
      className="bg-white px-4 py-8 text-neutral-900 sm:px-6 sm:py-12 lg:px-8 lg:py-16"
    >
      <div className="mx-auto max-w-7xl">
        <LandingMotionReveal>
          <PricingBentoGrid />
        </LandingMotionReveal>

        <LandingMotionReveal className="mb-10 mt-12 text-center sm:mb-14 sm:mt-16">
          <div
            className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-neutral-100 border border-neutral-200/80"
            role="group"
            aria-label="Choisir la fréquence de facturation"
          >
            <button
              type="button"
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
              type="button"
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
        </LandingMotionReveal>

        <LandingMotionStagger className="mb-10 grid grid-cols-1 gap-4 sm:mb-12 sm:grid-cols-2 sm:items-stretch md:grid-cols-3 md:gap-8">
          {plans.map((plan, planIndex) => {
            const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
            const href = getPlanHref(plan.id);

            return (
              <LandingMotionItem
                key={plan.id}
                index={planIndex}
                className={`divide-y divide-zinc-200 rounded-2xl border bg-white shadow-sm flex flex-col ${
                  plan.popular
                    ? 'border-blue-600 ring-2 ring-blue-600/15 order-first md:order-none'
                    : 'border-zinc-200'
                }`}
              >
                <div className="p-6 sm:px-8">
                  {plan.popular && (
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-600">
                      {t('pricing.mostPopular')}
                    </p>
                  )}
                  <h3 className="text-lg font-medium text-zinc-900">
                    {plan.name}
                    <span className="sr-only"> {t('pricing.planLabel')}</span>
                  </h3>
                  <p className="mt-2 text-pretty text-zinc-600 text-sm sm:text-base">
                    {t(plan.descriptionKey)}
                  </p>
                  <p className="mt-2 sm:mt-4">
                    <strong className="text-3xl font-bold text-zinc-900 sm:text-4xl">
                      {price}€
                    </strong>
                    <span className="text-sm font-medium text-zinc-600">
                      {t('pricing.perMonth')}
                    </span>
                  </p>
                  {isAnnual && (
                    <p className="text-sm text-zinc-500 mt-1">
                      {t('pricing.billed').replace('{amount}', String(plan.priceAnnual * 12))}
                    </p>
                  )}
                  <a
                    href={href}
                    className={`mt-4 block rounded-xl border px-6 py-3 min-h-[44px] text-center text-sm font-semibold transition-all active:scale-[0.98] sm:mt-6 ${
                      plan.popular
                        ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700'
                        : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800 hover:border-zinc-800'
                    }`}
                  >
                    {t('pricing.start')}
                  </a>
                </div>

                <div className="p-6 sm:px-8 flex-1">
                  <p className="text-lg font-medium text-zinc-900 sm:text-xl">
                    {t('pricing.included')}
                  </p>
                  <ul className="mt-2 space-y-2 sm:mt-4">
                    {COMPARISON_ROWS.map((row) => {
                      const included = row.included[plan.id];
                      return (
                        <li
                          key={`${plan.id}-${rowLabel(row, plan.id, t)}`}
                          className="flex items-start gap-2"
                        >
                          {included ? (
                            <Check
                              className="size-5 shrink-0 text-blue-600 mt-0.5"
                              strokeWidth={2}
                              aria-hidden
                            />
                          ) : (
                            <X
                              className="size-5 shrink-0 text-red-600 mt-0.5"
                              strokeWidth={2}
                              aria-hidden
                            />
                          )}
                          <span
                            className={`text-sm ${included ? 'text-zinc-700' : 'text-zinc-500'}`}
                          >
                            {rowLabel(row, plan.id, t)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </LandingMotionItem>
            );
          })}
        </LandingMotionStagger>

        <LandingMotionReveal className="space-y-4 text-center">
          <div className="flex justify-center items-center gap-6 flex-wrap text-sm text-neutral-600">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-600" aria-hidden />
              <span>{t('pricing.trial14')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-600" aria-hidden />
              <span>{t('pricing.cancelAnytime')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-600" aria-hidden />
              <span>{t('pricing.noCommitment')}</span>
            </div>
          </div>
        </LandingMotionReveal>
      </div>
    </section>
  );
};
