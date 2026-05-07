import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  X,
  AlertTriangle,
  Zap,
  Crown,
  Shield,
  Sparkles,
  ArrowRight,
  Clock,
  Users,
  Image,
  BarChart3,
  MessageSquare,
  Bot,
  Palette,
  Calendar,
  Receipt,
  Database,
} from 'lucide-react';
import {
  endStudioTrialEarly,
  getSubscription,
  isSubscriptionActive,
} from '../../lib/subscriptionGuard';
import { createSubscription, createPortalSession } from '../../lib/stripeClient';
import { TrialCountdown } from '../TrialCountdown';
import { useToast } from '../../contexts/ToastContext';
import type { Subscription, SubscriptionPlan } from '../../types';

interface BillingSettingsProps {
  studioId: string | null;
  userEmail: string;
  trialEndsAt?: string | null;
  /** Statut `inkflow_studios.subscription_status` (trialing, active, restricted…) */
  studioSubscriptionStatus?: string | null;
  /** Après mise à jour du statut studio (fin d’essai, etc.) */
  onStudioSubscriptionRefresh?: () => void | Promise<void>;
}

const plans: {
  id: SubscriptionPlan;
  name: string;
  description: string;
  details: string;
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
    details:
      '1 artiste, 100 clients CRM, réservation en ligne, Stripe + PayPal via Stripe, galerie et vitrine.',
    priceMonthly: 29,
    priceAnnual: 24,
    icon: <Zap className="w-5 h-5" />,
    color: 'blue',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Pour les studios en croissance',
    details:
      "Tout le cœur InkFlow : réservations, Stripe + PayPal via Stripe, galerie, vitrine, CRM jusqu'à 300 clients et 3 artistes.",
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
    details:
      '5 artistes inclus, clients CRM illimités, messagerie interne, assistant IA, API et support dédié.',
    priceMonthly: 99,
    priceAnnual: 79,
    icon: <Crown className="w-5 h-5" />,
    color: 'amber',
  },
];

const features = [
  {
    name: 'Réservations en ligne',
    solo: true,
    pro: true,
    studio: true,
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    name: 'Paiements Stripe + PayPal',
    solo: true,
    pro: true,
    studio: true,
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    name: 'Galerie Flash',
    solo: true,
    pro: true,
    studio: true,
    icon: <Image className="w-4 h-4" />,
  },
  {
    name: 'Vitrine personnalisée',
    solo: true,
    pro: true,
    studio: true,
    icon: <Palette className="w-4 h-4" />,
  },
  {
    name: 'Clients CRM',
    solo: '100',
    pro: '300',
    studio: 'Illimité',
    icon: <Users className="w-4 h-4" />,
  },
  {
    name: 'Artistes inclus',
    solo: '1',
    pro: '3',
    studio: '5+',
    icon: <Users className="w-4 h-4" />,
  },
  {
    name: 'Statistiques',
    solo: false,
    pro: 'Avancées',
    studio: 'Avancées',
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    name: 'Support',
    solo: 'Email',
    pro: 'Prioritaire',
    studio: 'Dédié',
    icon: <MessageSquare className="w-4 h-4" />,
  },
  {
    name: 'Messagerie interne',
    solo: false,
    pro: false,
    studio: true,
    icon: <MessageSquare className="w-4 h-4" />,
  },
  {
    name: 'Assistant IA',
    solo: false,
    pro: false,
    studio: true,
    icon: <Bot className="w-4 h-4" />,
  },
];

export const BillingSettings: React.FC<BillingSettingsProps> = ({
  studioId,
  userEmail,
  trialEndsAt,
  studioSubscriptionStatus,
  onStudioSubscriptionRefresh,
}) => {
  const toast = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [endingStudioTrial, setEndingStudioTrial] = useState(false);

  const reloadStripeSubscription = () => {
    if (!studioId) return;
    getSubscription(studioId)
      .then(setSubscription)
      .catch(() => {});
  };

  useEffect(() => {
    if (!studioId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getSubscription(studioId)
      .then(setSubscription)
      .catch(() => {
        toast.error('Une erreur est survenue');
      })
      .finally(() => setLoading(false));
  }, [studioId, toast]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!studioId) return;
    if (plan !== 'solo' && plan !== 'pro' && plan !== 'studio') return;
    setSubscribing(plan);
    const interval = isAnnual ? 'annual' : 'monthly';
    const result = await createSubscription({
      studioId,
      email: userEmail,
      plan,
      interval,
    });
    if ('url' in result) {
      window.location.href = result.url;
      return;
    }
    toast.error(result.error);
    setSubscribing(null);
  };

  const active = isSubscriptionActive(subscription);

  const canEndInkflowStudioTrial =
    Boolean(studioId) && studioSubscriptionStatus === 'trialing' && !active;

  const handleEndStudioTrial = async () => {
    if (!studioId || !canEndInkflowStudioTrial) return;
    const ok = window.confirm(
      "Mettre fin à l'essai gratuit Inkflow maintenant ?\n\n" +
        "Ton accès passera en mode restreint (comme après expiration des 14 jours) jusqu'à ce que tu souscrives à un plan. " +
        'Tu pourras toujours choisir un plan plus tard depuis cette page.'
    );
    if (!ok) return;
    setEndingStudioTrial(true);
    try {
      await endStudioTrialEarly(studioId);
      await onStudioSubscriptionRefresh?.();
      reloadStripeSubscription();
      toast.success('Période d’essai terminée. Tu peux souscrire à un plan quand tu veux.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Impossible de mettre fin à l’essai.');
    } finally {
      setEndingStudioTrial(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!studioId) return;
    setPortalLoading(true);
    const result = await createPortalSession({ studioId, email: userEmail });
    setPortalLoading(false);
    if ('url' in result) {
      window.location.href = result.url;
    } else {
      toast.error(result.error || "Impossible d'ouvrir le portail de facturation.");
    }
  };

  const getFeatureValue = (feature: (typeof features)[0], planId: string) => {
    const value = feature[planId as keyof typeof feature];
    if (value === true) return <Check className="w-4 h-4 text-blue-500" />;
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
    <div className="space-y-8 sm:space-y-10">
      {/* Header style landing */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-display">
            Abonnement
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base mt-1.5 max-w-xl">
            Choisissez le plan adapté à votre activité : Solo pour les artistes indépendants, Pro
            pour les studios en croissance, Studio pour les équipes. Facturation mensuelle ou
            annuelle, sans engagement.{' '}
            <span className="text-zinc-600 dark:text-zinc-300">
              Passer de Solo à Pro ou Studio ne supprime pas vos données : vous gardez votre
              historique, et seules les limites et les fonctionnalités prévues par votre formule
              s’appliquent.
            </span>
          </p>
        </div>
        {active && (
          <div className="flex flex-col items-end gap-1 max-w-[min(100%,280px)] text-right">
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {portalLoading ? (
                <span className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
              ) : (
                <Receipt className="w-4 h-4" />
              )}
              Gérer / Factures
            </button>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              Modifier le plan, moyen de paiement ou télécharger les factures
            </span>
            {subscription?.status === 'trialing' && (
              <span className="text-xs text-amber-600 dark:text-amber-400/90 mt-1">
                Essai Stripe : tu peux annuler ou modifier l’essai depuis ce portail avant la
                première facturation.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Current Plan Status — carte style landing */}
      {active && subscription && (
        <div className="rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 border-l-4 border-l-blue-500">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-100/80 dark:bg-blue-500/20 flex-shrink-0">
              <Check className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-zinc-900 dark:text-white">
                Plan {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} actif
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                {subscription.status === 'trialing'
                  ? "Période d'essai gratuit — accès complet à toutes les fonctionnalités"
                  : subscription.currentPeriodEnd
                    ? `Prochain renouvellement : ${new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')} — vous pouvez modifier ou annuler à tout moment`
                    : 'Abonnement actif'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trial Warning — carte style landing */}
      {!active && (
        <div className="rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 border-l-4 border-l-amber-500">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-100/80 dark:bg-amber-500/20 flex-shrink-0">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-zinc-900 dark:text-white">Période d'essai</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Profitez de toutes les fonctionnalités Pro pendant 14 jours, sans carte bancaire.
                Choisissez votre plan ci-dessous pour continuer après l'essai.
              </p>
              <div className="mt-3">
                <TrialCountdown trialEndsAt={trialEndsAt} />
              </div>
              {canEndInkflowStudioTrial && (
                <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                    Tu n’as pas encore souscrit via Stripe : tu peux mettre fin tout de suite à
                    l’essai gratuit Inkflow (accès restreint jusqu’à souscription), par exemple si
                    tu testais pour une démo.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleEndStudioTrial()}
                    disabled={endingStudioTrial || !studioId}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {endingStudioTrial ? (
                      <span className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    )}
                    Mettre fin à l’essai maintenant
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Billing Toggle — style pill landing avec détails */}
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
          Facturation mensuelle : paiement chaque mois, annulable à tout moment. Facturation
          annuelle : paiement unique par an, 2 mois offerts.
        </p>
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              !isAnnual
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              isAnnual
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Annuel
            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-semibold">
              -20%
            </span>
          </button>
        </div>
        {isAnnual ? (
          <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Économisez 2 mois par an — facturé une fois par an
          </p>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Facturé chaque mois — changez ou annulez quand vous voulez
          </p>
        )}
      </div>

      {/* Plans Grid — style landing premium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {plans.map((plan) => {
          const isCurrent = active && subscription?.plan === plan.id;
          const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border transition-all duration-200 ${
                plan.popular
                  ? 'bg-zinc-50 dark:bg-zinc-900/80 border-zinc-300 dark:border-zinc-700 ring-2 ring-zinc-900/5 dark:ring-white/5'
                  : isCurrent
                    ? 'bg-white dark:bg-zinc-900 border-blue-500/50 ring-2 ring-blue-500/10'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-white dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 text-xs font-semibold shadow-sm">
                    Populaire
                  </span>
                </div>
              )}

              {/* Current Badge */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm">
                    <Check className="w-3 h-3" />
                    Actuel
                  </span>
                </div>
              )}

              <div className="p-6 sm:p-7">
                {/* Header */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-2.5 rounded-xl ${
                        plan.color === 'blue'
                          ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                          : plan.color === 'violet'
                            ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
                            : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {plan.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-white">{plan.name}</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{plan.description}</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {plan.details}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-zinc-900 dark:text-white tabular-nums">
                      {price}€
                    </span>
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
                        <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
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
                        ? 'bg-blue-600 text-white dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 '
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
                  <div className="w-full py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold text-center">
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
          <ArrowRight
            className={`w-4 h-4 transition-transform ${showComparison ? 'rotate-90' : ''}`}
          />
        </button>
      </div>

      {/* Detailed Comparison Table */}
      {showComparison && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    Fonctionnalités
                  </th>
                  {plans.map((plan) => (
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
                    {plans.map((plan) => (
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

      {/* Trust badges — style landing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800">
            <Shield className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">Paiement sécurisé</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Via Stripe</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800">
            <Clock className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">Sans engagement</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Annulez à tout moment</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800">
            <Sparkles className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">14 jours d'essai</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Gratuit, sans CB</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 border-l-4 border-l-blue-500">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/15">
            <Database className="w-5 h-5 text-blue-700 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">Données conservées</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Changement de plan : pas de suppression de votre studio, CRM ou historique. Accès
              selon la formule choisie.
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
        Cadre contractuel :{' '}
        <a
          href="/conditions-utilisation"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-zinc-700 dark:text-zinc-300 underline underline-offset-2 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          conditions d&apos;utilisation
        </a>{' '}
        (section Abonnement et paiement).
      </p>
    </div>
  );
};
