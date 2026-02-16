import React, { useState, useEffect } from 'react';
import { CreditCard, Check, AlertTriangle, Zap, Crown, Shield } from 'lucide-react';
import { getSubscription, isSubscriptionActive } from '../../lib/subscriptionGuard';
import { createSubscription } from '../../lib/stripeClient';
import type { Subscription, SubscriptionPlan } from '../../types';

interface BillingSettingsProps {
  studioId: string | null;
  userEmail: string;
}

const plans: { id: SubscriptionPlan; name: string; priceMonthly: number; priceAnnual: number; features: string[]; icon: React.ReactNode }[] = [
  {
    id: 'solo',
    name: 'Solo',
    priceMonthly: 29,
    priceAnnual: 24,
    features: ['Reservations illimitees', 'Paiements Stripe', 'Galerie Flash', '100 clients CRM', 'Support email'],
    icon: <Zap className="w-5 h-5" />,
  },
  {
    id: 'studio',
    name: 'Studio',
    priceMonthly: 79,
    priceAnnual: 65,
    features: ['Tout du plan Solo', '5 artistes inclus', 'Clients CRM illimites', 'Messagerie interne', 'Statistiques avancees', 'Assistant IA'],
    icon: <Crown className="w-5 h-5" />,
  },
];

export const BillingSettings: React.FC<BillingSettingsProps> = ({ studioId, userEmail }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    if (!studioId) { setLoading(false); return; }
    getSubscription(studioId)
      .then(setSubscription)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studioId]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!studioId) return;
    setSubscribing(plan);
    const url = await createSubscription({
      studioId,
      email: userEmail,
      plan,
      interval: isAnnual ? 'annual' : 'monthly',
    });
    if (url) {
      window.location.href = url;
    } else {
      alert('Erreur lors de la creation de l\'abonnement. Les prix Stripe ne sont pas encore configures.');
      setSubscribing(null);
    }
  };

  const active = isSubscriptionActive(subscription);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Abonnement</h2>
        <p className="text-neutral-600 text-sm mt-1">Gerez votre plan InkFlow</p>
      </div>

      {active && subscription && (
        <div className="bg-white rounded-2xl p-6 border border-neutral-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-green-100">
              <Shield className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <div className="font-semibold">Plan {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}</div>
              <div className="text-sm text-green-600 font-medium">
                {subscription.status === 'trialing' ? 'Essai gratuit' : 'Actif'}
              </div>
            </div>
          </div>
          {subscription.currentPeriodEnd && (
            <p className="text-sm text-neutral-600">
              {subscription.cancelAtPeriodEnd
                ? `Se termine le ${new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}`
                : `Prochain renouvellement: ${new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}`}
            </p>
          )}
        </div>
      )}

      {!active && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">Vous n'avez pas d'abonnement actif. Choisissez un plan pour debloquer toutes les fonctionnalites.</p>
        </div>
      )}

      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-neutral-100 border border-neutral-200/80">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${!isAnnual ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200/80' : 'text-neutral-600'}`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all relative ${isAnnual ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-600'}`}
          >
            Annuel
            <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">-20%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map(plan => {
          const isCurrent = active && subscription?.plan === plan.id;
          return (
            <div key={plan.id} className={`bg-white rounded-2xl p-6 border-2 transition-all ${isCurrent ? 'border-green-500 shadow-lg' : 'border-neutral-200 hover:border-neutral-400'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-neutral-900 text-white">{plan.icon}</div>
                <div>
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  {isCurrent && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Plan actuel</span>}
                </div>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">{isAnnual ? plan.priceAnnual : plan.priceMonthly}EUR</span>
                <span className="text-neutral-600">/mois</span>
                {isAnnual && (
                  <div className="text-sm text-neutral-500 mt-1">Facture {plan.priceAnnual * 12}EUR par an</div>
                )}
              </div>
              <div className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-neutral-700">{feature}</span>
                  </div>
                ))}
              </div>
              {!isCurrent && (
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={!!subscribing}
                  className="w-full py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {subscribing === plan.id ? 'Redirection...' : 'Choisir ce plan'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
