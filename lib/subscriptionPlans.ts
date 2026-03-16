/**
 * Configuration des plans d'abonnement (Stripe) et permissions.
 * Utiliser canAccessFeature(plan, feature) et hasReachedLimit(plan, limitKey, currentCount)
 * côté frontend et backend.
 */
import type { SubscriptionPlan, PlanFeatureKey, PlanLimitKey } from '../types';

/** -1 = illimité */
export interface PlanLimits {
  artists: number;
  clients_crm: number;
}

export interface PlanConfig {
  id: SubscriptionPlan;
  name: string;
  priceEur: number | null;
  limits: PlanLimits;
  /** Liste des features autorisées pour ce plan */
  features: PlanFeatureKey[];
}

export const PLAN_CONFIG: Record<SubscriptionPlan, PlanConfig> = {
  solo: {
    id: 'solo',
    name: 'Solo',
    priceEur: 29,
    limits: {
      artists: 1,
      clients_crm: 100,
    },
    features: ['galerie_flash', 'app_mobile'],
    // Interdit : api_access, stats_avancees (non listés = pas d'accès)
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceEur: 49,
    limits: {
      artists: 3,
      clients_crm: 300,
    },
    features: ['galerie_flash', 'app_mobile', 'multi_calendriers', 'stats_avancees', 'themes_premium'],
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    priceEur: 99,
    limits: {
      artists: 5,
      clients_crm: -1,
    },
    features: [
      'galerie_flash',
      'app_mobile',
      'multi_calendriers',
      'stats_avancees',
      'api_access',
      'themes_premium',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceEur: null,
    limits: {
      artists: -1,
      clients_crm: -1,
    },
    features: [
      'galerie_flash',
      'app_mobile',
      'multi_calendriers',
      'stats_avancees',
      'api_access',
      'white_label',
      'themes_premium',
    ],
  },
};

/**
 * Vérifie si le plan donne accès à une fonctionnalité.
 * Utilisable côté frontend (masquer lien API, stats avancées, etc.) et backend (refuser l’appel).
 */
export function canAccessFeature(plan: SubscriptionPlan | null | undefined, feature: PlanFeatureKey): boolean {
  if (!plan) return false;
  const config = PLAN_CONFIG[plan];
  return config ? config.features.includes(feature) : false;
}

/**
 * Vérifie si la limite du plan est atteinte (ou dépassée).
 * @param plan - Plan actuel (solo | studio | enterprise)
 * @param limitKey - 'artists' ou 'clients_crm'
 * @param currentCount - Nombre actuel (ex. nombre d’artistes, nombre de clients CRM)
 * @returns true si la limite est atteinte ou dépassée (il ne faut pas autoriser l’ajout)
 */
export function hasReachedLimit(
  plan: SubscriptionPlan | null | undefined,
  limitKey: PlanLimitKey,
  currentCount: number
): boolean {
  if (!plan) return true;
  const config = PLAN_CONFIG[plan];
  if (!config) return true;
  const limit = config.limits[limitKey];
  if (limit === -1) return false; // illimité
  return currentCount >= limit;
}

/**
 * Retourne la limite numérique pour un plan (ou -1 si illimité).
 */
export function getPlanLimit(plan: SubscriptionPlan | null | undefined, limitKey: PlanLimitKey): number {
  if (!plan) return 0;
  const config = PLAN_CONFIG[plan];
  return config ? config.limits[limitKey] : 0;
}

/**
 * Retourne la config complète du plan (pour affichage ou logique métier).
 */
export function getPlanConfig(plan: SubscriptionPlan | null | undefined): PlanConfig | null {
  if (!plan) return null;
  return PLAN_CONFIG[plan] ?? null;
}
