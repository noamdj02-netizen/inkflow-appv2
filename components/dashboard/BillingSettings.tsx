import React, { useState, useEffect } from 'react';
import { CreditCard, Check, X, AlertTriangle, Zap, Crown, Shield, FileText, Sparkles, ArrowRight, Clock, Users, Image, BarChart3, MessageSquare, Bot, Palette, Calendar, Receipt } from 'lucide-react';
import { getSubscription, isSubscriptionActive } from '../../lib/subscriptionGuard';
import { createSubscription, createPortalSession } from '../../lib/stripeClient';
import { getStripeBillingLink } from '../../lib/stripePaymentLinks';
import { TrialCountdown } from '../TrialCountdown';
import { useToast } from '../../contexts/ToastContext';
import type { Subscription, SubscriptionPlan } from '../../types';

interface BillingSettingsProps {
  studioId: string | null;
  userEmail: string;
  trialEndsAt?: string | null;
}

const plans: { 
  id: SubscriptionPlan; 
  name: string; 
  description: string;
  priceMonthly: number; 
  priceAnnual: number; 
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    id: 'solo',
    name: 'Solo',
    description: 'Pour les artistes indépendants',
    priceMonthly: 29,
    priceAnnual: 24,
    icon: <Zap className="w-5 h-5" />,
    color: 'blue',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Pour les studios en croissance',
    priceMonthly: 49,
    priceAnnual: 39,
    popular: true,
    icon: <Shield className="w-5 h-5" />,
    color: 'violet',
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Pour les grands studios',
    priceMonthly: 99,
    priceAnnual: 79,
    icon: <Crown className="w-5 h-5" />,
    color: 'amber',
  },
];

const features = [
  { name: 'Réservations en ligne', solo: true, pro: true, studio: true, icon: <Calendar className="w-4 h-4" /> },
  { name: 'Paiements Stripe', solo: true, pro: true, studio: true, icon: <CreditCard className="w-4 h-4" /> },
  { name: 'Galerie Flash', solo: true, pro: true, studio: true, icon: <Image className="w-4 h-4" /> },
  { name: 'Vitrine personnalisée', solo: true, pro: true, studio: true, icon: <Palette className="w-4 h-4" /> },
  { name: 'Clients CRM', solo: '100', pro: '300', studio: 'Illimité', icon: <Users className="w-4 h-4" /> },
  { name: 'Artistes inclus', solo: '1', pro: '3', studio: '5+', icon: <Users className="w-4 h-4" /> },
  { name: 'Statistiques', solo: false, pro: 'Basiques', studio: 'Avancées', icon: <BarChart3 className="w-4 h-4" /> },
  { name: 'Support', solo: 'Email', pro: 'Prioritaire', studio: 'Dédié', icon: <MessageSquare className="w-4 h-4" /> },
  { name: 'Messagerie interne', solo: false, pro: false, studio: true, icon: <MessageSquare className="w-4 h-4" /> },
  { name: 'Assistant IA', solo: false, pro: false, studio: true, icon: <Bot className="w-4 h-4" /> },
];

export const BillingSettings: React.FC<BillingSettingsProps> = ({ studioId, userEmail, trialEndsAt }) => {
  const toast = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (!studioId) { setLoading(false); return; }
    getSubscription(studioId)
      .then(setSubscription)
      .catch(() => { toast.error('Une erreur est survenue'); })
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
      toast.error('Erreur lors de la création de l\'abonnement.');
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

  const getFeatureValue = (feature: typeof features[0], planId: string) => {
    const value = feature[planId as keyof typeof feature];
    if (value === true) return <Check className="w-4 h-4 text-emerald-500" />;
    if (value === false) return <X className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />;
    return <span className="text-sm font-medium text-zinc-900 dark:text-white">{value}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Abonnement</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Choisissez le plan adapté à votre activité</p>
        </div>
        {active && (
          <button
            onClick={handleManageSubscription}
            disabled={portalLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {portalLoading ? (
              <span className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
            ) : (
              <Receipt className="w-4 h-4" />
            )}
            Gérer / Factures
          </button>
        )}
      </div>

      {/* Current Plan Status */}
      {active && subscription && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-500/20">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
              <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                Plan {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} actif
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300/80">
                {subscription.status === 'trialing' 
                  ? 'Période d\'essai gratuit' 
                  : subscription.currentPeriodEnd 
                    ? `Prochain renouvellement : ${new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}`
                    : 'Abonnement actif'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trial Warning */}
      {!active && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 rounded-2xl p-5 border border-amber-200 dark:border-amber-500/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex-shrink-0">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-900 dark:text-amber-200">Période d'essai</p>
              <p className="text-sm text-amber-700 dark:text-amber-300/80 mt-1">
                Profitez de toutes les fonctionnalités pendant 14 jours. Abonnez-vous pour continuer.
              </p>
              <div className="mt-3">
                <TrialCountdown trialEndsAt={trialEndsAt} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              !isAnnual 
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' 
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              isAnnual 
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' 
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Annuel
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              -20%
            </span>
          </button>
        </div>
        {isAnnual && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            Économisez 2 mois par an
          </p>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(plan => {
          const isCurrent = active && subscription?.plan === plan.id;
          const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
          
          return (
            <div 
              key={plan.id} 
              className={`relative bg-white dark:bg-zinc-900 rounded-2xl border-2 transition-all ${
                plan.popular 
                  ? 'border-zinc-900 dark:border-white shadow-xl scale-[1.02]' 
                  : isCurrent 
                    ? 'border-emerald-500 shadow-lg'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold">
                    Populaire
                  </span>
                </div>
              )}

              {/* Current Badge */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Actuel
                  </span>
                </div>
              )}

              <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-xl ${
                    plan.color === 'blue' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                    plan.color === 'violet' ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400' :
                    'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  }`}>
                    {plan.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white">{plan.name}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{plan.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-zinc-900 dark:text-white tabular-nums">{price}€</span>
                    <span className="text-zinc-500 dark:text-zinc-400">/mois</span>
                  </div>
                  {isAnnual && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                      Facturé {price * 12}€/an
                    </p>
                  )}
                </div>

                {/* Quick Features */}
                <div className="space-y-2.5 mb-6">
                  {features.slice(0, 5).map((feature, i) => {
                    const value = feature[plan.id as keyof typeof feature];
                    if (value === false) return null;
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {feature.name}
                          {typeof value === 'string' && value !== 'true' && (
                            <span className="text-zinc-500 dark:text-zinc-400"> ({value})</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* CTA */}
                {!isCurrent ? (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={!!subscribing}
                    className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                      plan.popular 
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100' 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {subscribing === plan.id ? (
                      <>
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Redirection...
                      </>
                    ) : (
                      <>
                        Choisir {plan.name}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-full py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold text-center">
                    Plan actuel
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Toggle */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          {showComparison ? 'Masquer' : 'Voir'} la comparaison détaillée
          <ArrowRight className={`w-4 h-4 transition-transform ${showComparison ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Detailed Comparison Table */}
      {showComparison && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    Fonctionnalités
                  </th>
                  {plans.map(plan => (
                    <th key={plan.id} className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold text-zinc-900 dark:text-white">{plan.name}</span>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          {isAnnual ? plan.priceAnnual : plan.priceMonthly}€/mois
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, i) => (
                  <tr 
                    key={i} 
                    className={`border-b border-zinc-50 dark:border-zinc-800/50 ${
                      i % 2 === 0 ? 'bg-zinc-50/50 dark:bg-zinc-800/20' : ''
                    }`}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                        <span className="text-zinc-400 dark:text-zinc-500">{feature.icon}</span>
                        {feature.name}
                      </div>
                    </td>
                    {plans.map(plan => (
                      <td key={plan.id} className="px-6 py-3.5 text-center">
                        {getFeatureValue(feature, plan.id)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FAQ / Trust */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
          <Shield className="w-5 h-5 text-zinc-400" />
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">Paiement sécurisé</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Via Stripe</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
          <Clock className="w-5 h-5 text-zinc-400" />
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">Sans engagement</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Annulez à tout moment</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
          <Sparkles className="w-5 h-5 text-zinc-400" />
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">14 jours d'essai</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Gratuit, sans CB</p>
          </div>
        </div>
      </div>
    </div>
  );
};
