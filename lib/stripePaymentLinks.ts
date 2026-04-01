/**
 * Stripe Payment Links — utilisés par la section tarifaire et le dashboard.
 * Mettre à jour ces URLs si vous créez de nouveaux liens dans le Stripe Dashboard.
 */
export const STRIPE_PAYMENT_LINKS = {
  starter: 'https://buy.stripe.com/28EaEQ52e1erbS66W0fUQ09',
  pro: 'https://buy.stripe.com/fZucMY3Ya0anbS6a8cfUQ0a',
  studio: 'https://buy.stripe.com/dRm14gamyg9lf4i804fUQ0b',
} as const;

/**
 * Liens Stripe pour la page Abonnement (BillingSettings).
 * Créez des Payment Links séparés (mensuel + annuel) dans Stripe Dashboard.
 * Pour l'annuel, définissez VITE_STRIPE_BILLING_*_ANNUAL en variables d'environnement.
 */
const BILLING_BASE = {
  solo: { monthly: 'https://buy.stripe.com/28EaEQ52e1erbS66W0fUQ09' },
  pro: { monthly: 'https://buy.stripe.com/fZucMY3Ya0anbS6a8cfUQ0a' },
  studio: { monthly: 'https://buy.stripe.com/dRm14gamyg9lf4i804fUQ0b' },
} as const;

function getBillingLinks(): Record<'solo' | 'pro' | 'studio', { monthly: string; annual: string }> {
  const env = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}) as Record<string, string | undefined>;
  return {
    solo: {
      monthly: BILLING_BASE.solo.monthly,
      annual: (env.VITE_STRIPE_BILLING_SOLO_ANNUAL as string) || BILLING_BASE.solo.monthly,
    },
    pro: {
      monthly: BILLING_BASE.pro.monthly,
      annual: (env.VITE_STRIPE_BILLING_PRO_ANNUAL as string) || BILLING_BASE.pro.monthly,
    },
    studio: {
      monthly: BILLING_BASE.studio.monthly,
      annual: (env.VITE_STRIPE_BILLING_STUDIO_ANNUAL as string) || BILLING_BASE.studio.monthly,
    },
  };
}

export const STRIPE_BILLING_LINKS = getBillingLinks();

export type StripePlanId = keyof typeof STRIPE_PAYMENT_LINKS;

export function getStripePaymentLink(plan: StripePlanId): string {
  return STRIPE_PAYMENT_LINKS[plan];
}

export function getStripeBillingLink(plan: 'solo' | 'pro' | 'studio', interval: 'monthly' | 'annual'): string {
  return STRIPE_BILLING_LINKS[plan][interval];
}
