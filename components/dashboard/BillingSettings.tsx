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
  Palette,
  Calendar,
  CalendarRange,
  Receipt,
  Database,
  Smartphone,
  Plug,
  Loader2,
} from 'lucide-react';
import {
  endStudioTrialEarly,
  getSubscription,
  isSubscriptionActive,
} from '../../lib/subscriptionGuard';
import { createSubscription, createPortalSession } from '../../lib/stripeClient';
import { TrialCountdown } from '../TrialCountdown';
import { useToast } from '../../contexts/ToastContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
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
  /** Texte pied de carte : complète les bullets (vérité produit PLAN_CONFIG). */
  details: string;
  /** Lignes clés affichées sur la carte — ce qui fait vraiment monter ou baisser d’un palier. */
  highlights: string[];
  priceMonthly: number;
  priceAnnual: number;
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    id: 'solo',
    name: 'Solo',
    description: 'Indépendant · socle fonctionnel InkFlow avec plafonds',
    highlights: [
      '1 poste tatoueur et jusqu’à 100 contacts CRM suivis.',
      'Même bloc « cœur » que les autres formules : réservations en ligne, encaissements Stripe / PayPal, vitrine publique et galerie Flash.',
      'Espace client et parcours mobile inclus.',
      'Multi-calendriers étendus, statistiques avancées et thèmes vitrine premium : passer au Pro lorsque vos besoins grandissent.',
    ],
    details:
      'Pas de « petite formule bridée » : Solo offre tout le bloc fonctionnel commun (réservations, paiements, vitrine, CRM…). Ce qui manque jusqu’à Pro, ce sont vos plafonds et trois briques équipe très visibles.',
    priceMonthly: 29,
    priceAnnual: 24,
    icon: <Zap className="w-5 h-5" />,
    color: 'blue',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Petite équipe · plafonds relevés + options « équipe InkFlow »',
    highlights: [
      'Jusqu’à 3 tatoueurs et 300 fiches CRM.',
      'Tout le socle Solo, plus plusieurs créneaux d’agenda / multi-calendriers, indicateurs financiers poussés et thèmes vitrine premium.',
      'Idéal lorsque plusieurs agendas ou la mise en avant visuelle dépassent le terrain « solo ».',
      'Pas d’accès API : si vous automatisez ou branchez des outils tiers, voyez Studio.',
    ],
    details:
      'Pro élève vos plafonds (sièges, fiches CRM) et active dans le logiciel précisément : multi-calendriers, statistiques avancées et thèmes vitrine premium.',
    priceMonthly: 49,
    priceAnnual: 39,
    popular: true,
    icon: <Shield className="w-5 h-5" />,
    color: 'violet',
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Studio structuré · volumes larges et branchements techniques',
    highlights: [
      'Jusqu’à 5 tatoueurs et contacts CRM illimités.',
      'Toutes les fonctionnalités Pro incluses.',
      'Seule formule de cette grille où l’API développeurs InkFlow est prévue comme accessible.',
    ],
    details:
      "À ce niveau, vous élargissez surtout les volumes (sièges, CRM) et la couche d'interopérabilité : l'accès API n'est disponible ni en Solo ni en Pro.",
    priceMonthly: 99,
    priceAnnual: 79,
    icon: <Crown className="w-5 h-5" />,
    color: 'amber',
  },
];

/** Comparaison alignée sur `PLAN_CONFIG` / `PlanFeatureKey` — pas de promesse hors enums. */
const features = [
  {
    name: 'Postes tatoueurs (facturés inclus)',
    solo: '1',
    pro: '3',
    studio: '5',
    icon: <Users className="w-4 h-4" />,
  },
  {
    name: 'Contacts CRM',
    solo: '100 max',
    pro: '300 max',
    studio: 'Illimité',
    icon: <Users className="w-4 h-4" />,
  },
  {
    name: 'Réservations en ligne & page book',
    solo: true,
    pro: true,
    studio: true,
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    name: 'Encaissements Stripe & PayPal (via Stripe)',
    solo: true,
    pro: true,
    studio: true,
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    name: 'Galerie Flash & vitrine publique',
    solo: true,
    pro: true,
    studio: true,
    icon: <Image className="w-4 h-4" />,
  },
  {
    name: 'Espace client · parcours mobile',
    solo: true,
    pro: true,
    studio: true,
    icon: <Smartphone className="w-4 h-4" />,
  },
  {
    name: 'Multi-calendriers équipe',
    solo: false,
    pro: true,
    studio: true,
    icon: <CalendarRange className="w-4 h-4" />,
  },
  {
    name: 'Statistiques avancées dashboard',
    solo: false,
    pro: true,
    studio: true,
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    name: 'Thèmes vitrine premium',
    solo: false,
    pro: true,
    studio: true,
    icon: <Palette className="w-4 h-4" />,
  },
  {
    name: 'Accès API & intégrations',
    solo: false,
    pro: false,
    studio: true,
    icon: <Plug className="w-4 h-4" />,
  },
  {
    name: 'Relation client / support commercial',
    solo: 'E-mail standard',
    pro: 'Réponse prioritaire',
    studio: 'Accompagnement renforcé',
    icon: <MessageSquare className="w-4 h-4" />,
  },
];

/**
 * Carte tarifaire — compose shadcn `Card`, `Badge`, `Separator`, `Button`
 * + inspiration grille pricing commerciale (réf. 21st / AuthenticUI).
 */
interface BillingPlanPricingCardProps {
  plan: (typeof plans)[number];
  price: number;
  isAnnual: boolean;
  isCurrent: boolean;
  isSubscribing: boolean;
  onSubscribe: () => void;
}

const BillingPlanPricingCard: React.FC<BillingPlanPricingCardProps> = ({
  plan,
  price,
  isAnnual,
  isCurrent,
  isSubscribing,
  onSubscribe,
}) => {
  const iconAccent =
    plan.color === 'blue'
      ? 'text-blue-600 dark:text-blue-400'
      : plan.color === 'violet'
        ? 'text-violet-600 dark:text-violet-400'
        : 'text-amber-700 dark:text-amber-400';

  return (
    <Card
      size="sm"
      className={cn(
        'relative h-full gap-6 rounded-2xl border-border bg-card py-6 shadow-sm sm:py-8',
        plan.popular &&
          'border-primary/40 shadow-[0_22px_50px_-24px_rgba(15,23,42,0.28)] ring-1 ring-primary/20 dark:border-primary/35 dark:shadow-[0_28px_64px_-32px_rgba(0,0,0,0.45)] dark:ring-primary/25',
        !plan.popular &&
          isCurrent &&
          'border-primary/50 shadow-md ring-2 ring-primary/18 ring-offset-2 ring-offset-background',
        !plan.popular && !isCurrent && 'border-border hover:border-muted-foreground/25'
      )}
    >
      <CardHeader className="relative gap-4 border-border border-b pb-6">
        <CardAction className="absolute top-6 end-6 z-10 flex flex-col gap-2">
          {plan.popular && !isCurrent && (
            <Badge className="h-7 rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm">
              Populaire
            </Badge>
          )}
          {isCurrent && (
            <Badge
              variant="secondary"
              className="h-7 gap-1 rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
            >
              <Check data-icon="inline-start" className="size-3" strokeWidth={2.5} aria-hidden />
              Actuel
            </Badge>
          )}
        </CardAction>

        <div className="flex flex-col gap-4 pe-28 sm:flex-row sm:items-start sm:gap-4 sm:pe-24">
          <div
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/80 [&>svg]:size-5',
              iconAccent
            )}
          >
            {plan.icon}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Formule
            </p>
            <CardTitle className="font-display text-xl font-bold tracking-tight text-foreground">
              {plan.name}
            </CardTitle>
            <CardDescription className="text-sm leading-snug">{plan.description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-muted/40 px-4 py-4">
          <div className="flex flex-wrap items-end gap-x-1.5 gap-y-0.5">
            <span className="font-display text-4xl font-bold tabular-nums tracking-tight text-foreground">
              {price}
            </span>
            <span className="pb-1 text-base font-semibold text-muted-foreground">€</span>
            <span className="pb-1 text-sm font-medium text-muted-foreground">/ mois</span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {isAnnual
              ? `Équiv. annuel ${price * 12} € / an (montant équivalent mensuel comme sur Stripe).`
              : 'Facturation mensuelle, sans engagement prolongé.'}
          </p>
        </div>

        <Separator />

        <ul className="flex flex-1 flex-col gap-3">
          {plan.highlights.map((text, i) => (
            <li
              key={`${plan.id}-hl-${i}`}
              className="flex items-start gap-2.5 text-sm leading-snug"
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary">
                <Check className="size-3" strokeWidth={2.5} aria-hidden />
              </span>
              <span className="text-foreground">{text}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-4 [.border-t]:pt-6">
        {!isCurrent ? (
          <Button
            variant={plan.popular ? 'default' : 'outline'}
            size="lg"
            className="h-12 w-full rounded-xl active:translate-y-px motion-safe:transition-transform"
            onClick={onSubscribe}
            disabled={isSubscribing}
          >
            {isSubscribing ? (
              <>
                <Loader2 data-icon="inline-start" className="size-4 animate-spin" aria-hidden />
                Redirection Stripe…
              </>
            ) : (
              <>
                Choisir {plan.name}
                <ArrowRight data-icon="inline-end" className="size-4 shrink-0" aria-hidden />
              </>
            )}
          </Button>
        ) : (
          <div className="flex min-h-12 w-full flex-col justify-center rounded-xl border border-primary/35 bg-muted/70 px-4 py-3 text-center text-sm font-semibold text-foreground dark:bg-muted/40">
            Votre formule active
          </div>
        )}

        <p className="text-center text-[11px] leading-relaxed text-muted-foreground sm:text-start">
          {plan.details}
        </p>
      </CardFooter>
    </Card>
  );
};

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
            Choisissez une formule selon vos volumes : sièges tatoueurs, niveau des analyses, puis
            besoin ou non d’API. Stripe reste la source de vérité sur les prix affichés. Changer de
            formule conserve vos données ; seuls les usages autorisés par le palier s’actualisent.{' '}
            <span className="text-zinc-600 dark:text-zinc-300">
              Solo partage avec Pro le même socle : réservation, paiements, vitrine, CRM. À chaque
              palier suivant augmentent vos plafonds puis s’activent des briques listées ci-dessous
              (pas une autre « app fermée » au départ).
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

      {/* Plans Grid — cartes pricing (réf. AuthenticUI / 21st) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 md:items-stretch">
        {plans.map((plan) => {
          const isCurrent = active && subscription?.plan === plan.id;
          const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;

          return (
            <BillingPlanPricingCard
              key={plan.id}
              plan={plan}
              price={price}
              isAnnual={isAnnual}
              isCurrent={!!isCurrent}
              isSubscribing={subscribing === plan.id}
              onSubscribe={() => void handleSubscribe(plan.id)}
            />
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
