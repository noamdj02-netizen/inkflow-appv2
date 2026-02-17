/**
 * Hook pour vérifier les permissions liées au plan d'abonnement (Stripe)
 * côté frontend : canAccessFeature(feature), hasReachedLimit(limitKey, currentCount).
 */
import { useState, useEffect, useCallback } from 'react';
import { getSubscription } from '../lib/subscriptionGuard';
import { canAccessFeature as canAccessFeatureFn, hasReachedLimit as hasReachedLimitFn, getPlanLimit } from '../lib/subscriptionPlans';
import type { SubscriptionPlan, PlanFeatureKey, PlanLimitKey, Subscription } from '../types';

export interface UseSubscriptionPermissionsResult {
  /** Plan actuel (solo par défaut si pas d'abonnement actif) */
  plan: SubscriptionPlan;
  /** Abonnement actif (Stripe) ou null */
  subscription: Subscription | null;
  loading: boolean;
  /** Vérifie si la feature est incluse dans le plan */
  canAccessFeature: (feature: PlanFeatureKey) => boolean;
  /** Vérifie si la limite est atteinte (true = ne pas autoriser l'ajout) */
  hasReachedLimit: (limitKey: PlanLimitKey, currentCount: number) => boolean;
  /** Retourne la limite numérique (-1 = illimité) */
  getLimit: (limitKey: PlanLimitKey) => number;
}

export function useSubscriptionPermissions(studioId: string | null): UseSubscriptionPermissionsResult {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(!!studioId);

  useEffect(() => {
    if (!studioId) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getSubscription(studioId)
      .then(setSubscription)
      .finally(() => setLoading(false));
  }, [studioId]);

  const plan: SubscriptionPlan = (subscription?.plan ?? 'solo') as SubscriptionPlan;

  const canAccessFeature = useCallback(
    (feature: PlanFeatureKey) => canAccessFeatureFn(plan, feature),
    [plan]
  );

  const hasReachedLimit = useCallback(
    (limitKey: PlanLimitKey, currentCount: number) => hasReachedLimitFn(plan, limitKey, currentCount),
    [plan]
  );

  const getLimit = useCallback((limitKey: PlanLimitKey) => getPlanLimit(plan, limitKey), [plan]);

  return {
    plan,
    subscription,
    loading,
    canAccessFeature,
    hasReachedLimit,
    getLimit,
  };
}
