/**
 * Configuration des plans d'abonnement (Stripe) et permissions.
 * Utiliser canAccessFeature(plan, feature) et hasReachedLimit(plan, limitKey, currentCount)
 * côté frontend et backend.
 *
 * Slugs techniques (DB / Stripe metadata) : solo | pro | studio | enterprise
 * Libellés commerciaux 2026-08 : Essentiel (solo) · Pro · Studio · Enterprise
 */
import type { SubscriptionPlan, PlanFeatureKey, PlanLimitKey } from '../types';

/** Socle Essentiel — agenda, CRM, vitrine, encaissements, facturation, traçabilité simple */
const ESSENTIEL_FEATURES: PlanFeatureKey[] = [
  'reservations_online',
  'stripe_payments',
  'paypal_payments',
  'vitrine_public',
  'crm_clients',
  'galerie_flash',
  'app_mobile',
  'facturation',
  'traceabilite_simple',
];

/** Pro — Essentiel + stats, fidélité, multi-cal., thèmes premium (traçabilité = tous plans payants) */
const PRO_FEATURES: PlanFeatureKey[] = [
  ...ESSENTIEL_FEATURES,
  'stats_avancees',
  'fidelite',
  'multi_calendriers',
  'themes_premium',
];

/** Studio — Pro + équipe / rôles + API */
const STUDIO_FEATURES: PlanFeatureKey[] = [...PRO_FEATURES, 'equipe_roles', 'api_access'];

/** -1 = illimité */
export interface PlanLimits {
  artists: number;
  clients_crm: number;
}

export interface PlanConfig {
  id: SubscriptionPlan;
  /** Nom affiché dashboard / emails (≠ slug Stripe) */
  name: string;
  /** Prix mensuel cible documenté (€ TTC) — Stripe TEST à aligner séparément */
  priceEur: number | null;
  limits: PlanLimits;
  /** Liste des features autorisées pour ce plan */
  features: PlanFeatureKey[];
}

/** Libellés commerciaux — le slug `solo` reste « Essentiel » côté produit */
export const PLAN_DISPLAY_NAMES: Record<SubscriptionPlan, string> = {
  solo: 'Essentiel',
  pro: 'Pro',
  studio: 'Studio',
  enterprise: 'Enterprise',
};

/** Fourchette prix cible (€/mois) — ne remplace pas les price IDs Stripe */
export const PLAN_TARGET_PRICE_EUR: Record<
  SubscriptionPlan,
  { monthly: number | null; annualMonthlyEquiv?: number }
> = {
  solo: { monthly: 14, annualMonthlyEquiv: 12 },
  pro: { monthly: 37, annualMonthlyEquiv: 31 },
  studio: { monthly: 99, annualMonthlyEquiv: 79 },
  enterprise: { monthly: null },
};

export const PLAN_CONFIG: Record<SubscriptionPlan, PlanConfig> = {
  solo: {
    id: 'solo',
    name: PLAN_DISPLAY_NAMES.solo,
    priceEur: PLAN_TARGET_PRICE_EUR.solo.monthly,
    limits: {
      artists: 1,
      clients_crm: 100,
    },
    features: ESSENTIEL_FEATURES,
  },
  pro: {
    id: 'pro',
    name: PLAN_DISPLAY_NAMES.pro,
    priceEur: PLAN_TARGET_PRICE_EUR.pro.monthly,
    limits: {
      artists: 3,
      clients_crm: 300,
    },
    features: PRO_FEATURES,
  },
  studio: {
    id: 'studio',
    name: PLAN_DISPLAY_NAMES.studio,
    priceEur: PLAN_TARGET_PRICE_EUR.studio.monthly,
    limits: {
      artists: 5,
      clients_crm: -1,
    },
    features: STUDIO_FEATURES,
  },
  enterprise: {
    id: 'enterprise',
    name: PLAN_DISPLAY_NAMES.enterprise,
    priceEur: null,
    limits: {
      artists: -1,
      clients_crm: -1,
    },
    features: [...STUDIO_FEATURES, 'white_label'],
  },
};

/**
 * Vérifie si le plan donne accès à une fonctionnalité.
 * Utilisable côté frontend (masquer lien API, stats avancées, etc.) et backend (refuser l’appel).
 */
export function canAccessFeature(
  plan: SubscriptionPlan | null | undefined,
  feature: PlanFeatureKey
): boolean {
  if (!plan) return false;
  const config = PLAN_CONFIG[plan];
  return config ? config.features.includes(feature) : false;
}

/**
 * Vérifie si la limite du plan est atteinte (ou dépassée).
 * @param plan - Plan actuel (solo | pro | studio | enterprise)
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
export function getPlanLimit(
  plan: SubscriptionPlan | null | undefined,
  limitKey: PlanLimitKey
): number {
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
