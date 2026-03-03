import React, { useState, useEffect } from 'react';
import { CreditCard, Check, AlertTriangle, Zap, Crown, Shield, FileText } from 'lucide-react';
import { getSubscription, isSubscriptionActive } from '../../lib/subscriptionGuard';
import { createSubscription, createPortalSession } from '../../lib/stripeClient';
import { getStripeBillingLink } from '../../lib/stripePaymentLinks';
import { TrialCountdown } from '../TrialCountdown';
import { useToast } from '../../contexts/ToastContext';
import type { Subscription, SubscriptionPlan } from '../../types';

interface BillingSettingsProps {
  studioId: string | null;
  userEmail: string;
  /** Date de fin d'essai (ISO string) — pour le compteur à rebours */
  trialEndsAt?: string | null;
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
    id: 'pro',
    name: 'Pro',
    priceMonthly: 49,
    priceAnnual: 39,
    features: ['Tout du plan Solo', '3 artistes inclus', '300 clients CRM', 'Statistiques de base', 'Support prioritaire'],
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: 'studio',
    name: 'Studio',
    priceMonthly: 99,
    priceAnnual: 79,
    features: ['Tout du plan Pro', '5 artistes inclus', 'Clients CRM illimites', 'Messagerie interne', 'Statistiques avancees', 'Assistant IA'],
    icon: <Crown className="w-5 h-5" />,
  },
];

export const BillingSettings: React.FC<BillingSettingsProps> = ({ studioId, userEmail, trialEndsAt }) => {
  const toast = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!studioId) { setLoading(false); return; }
    getSubscription(studioId)
      .then(setSubscription)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studioId]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!studioId) return;
    if (plan !== 'solo' && plan !== 'pro' && plan !== 'studio') return;
    setSubscribing(plan);
    const interval = isAnnual ? 'annual' : 'monthly';
    const directLink = getStripeBillingLink(plan, interval);
    const url = await createSubscription({
      studioId,
      email: userEmail,
      plan,
      interval,
    });
    if (url) {
      window.location.href = url;
    } else if (directLink) {
      window.location.href = directLink;
    } else {
      alert('Erreur lors de la création de l\'abonnement. Les liens Stripe ne sont pas configurés.');
      setSubscribing(null);
    }
  };

  const active = isSubscriptionActive(subscription);

  const handleManageSubscription = async () => {
    if (!studioId) return;
    setPortalLoading(true);
    const result = await createPortalSession({ studioId, email: userEmail });
    setPortalLoading(false);
    if ('url' in result) {
      window.location.href = result.url;
    } else {
      toast.error(result.error || 'Impossible d\'ouvrir le portail de facturation.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Abonnement</h2>
          <p className="text-neutral-600 text-sm mt-1">Gerez votre plan InkFlow</p>
        </div>
        <button
          onClick={handleManageSubscription}
          disabled={portalLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-neutral-300 dark:border-neutral-600 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 shrink-0"
        >
          {portalLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-700 dark:border-neutral-600 dark:border-t-neutral-400 rounded-full animate-spin" />
              Ouverture...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Gérer mon abonnement / Factures
            </>
          )}
        </button>
      </div>

      {active && subscription && (
        <div className="bg-white rounded-2xl p-6 border border-neutral-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-500/20">
              <Shield className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            </div>
            <div>
              <div className="font-semibold">Plan {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
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
        <div className="bg-zinc-100 dark:bg-zinc-500/20 border border-zinc-200 dark:border-zinc-600 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-zinc-600 dark:text-zinc-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-800 dark:text-zinc-200">
              Votre période d&apos;essai de 14 jours se termine bientôt. Abonnez-vous maintenant pour ne pas perdre l&apos;accès à vos fonctionnalités pro.
            </p>
            <TrialCountdown trialEndsAt={trialEndsAt} />
          </div>
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
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">-20%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const isCurrent = active && subscription?.plan === plan.id;
          return (
            <div key={plan.id} className={`bg-white rounded-2xl p-6 border-2 transition-all ${isCurrent ? 'border-blue-500 shadow-lg' : 'border-neutral-200 hover:border-neutral-400'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-neutral-900 text-white">{plan.icon}</div>
                <div>
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  {isCurrent && <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold">Plan actuel</span>}
                </div>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">{isAnnual ? plan.priceAnnual : plan.priceMonthly} EUR</span>
                <span className="text-neutral-600">/mois</span>
                {isAnnual && (
                  <div className="text-sm text-neutral-500 mt-1">Facture {plan.priceAnnual * 12} EUR par an</div>
                )}
              </div>
              <div className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
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
