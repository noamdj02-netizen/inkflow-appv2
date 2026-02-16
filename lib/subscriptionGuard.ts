import { supabase } from './supabase';
import type { Subscription, SubscriptionPlan } from '../types';

const PLAN_LIMITS: Record<SubscriptionPlan, { maxArtists: number; maxClients: number; features: string[] }> = {
  solo: {
    maxArtists: 1,
    maxClients: 100,
    features: ['bookings', 'payments', 'flash_gallery', 'crm_basic', 'analytics_basic'],
  },
  studio: {
    maxArtists: 5,
    maxClients: -1,
    features: ['bookings', 'payments', 'flash_gallery', 'crm_full', 'analytics_full', 'multi_artist', 'messaging', 'loyalty', 'ai_assistant'],
  },
  enterprise: {
    maxArtists: -1,
    maxClients: -1,
    features: ['bookings', 'payments', 'flash_gallery', 'crm_full', 'analytics_full', 'multi_artist', 'messaging', 'loyalty', 'ai_assistant', 'white_label', 'api_access'],
  },
};

function mapSubscription(row: Record<string, unknown>): Subscription {
  return {
    id: row.id as string,
    studioId: row.studio_id as string,
    stripeSubscriptionId: row.stripe_subscription_id as string | undefined,
    stripeCustomerId: row.stripe_customer_id as string | undefined,
    plan: (row.plan as SubscriptionPlan) || 'solo',
    status: (row.status as Subscription['status']) || 'trialing',
    currentPeriodStart: row.current_period_start as string | undefined,
    currentPeriodEnd: row.current_period_end as string | undefined,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    createdAt: (row.created_at as string) || new Date().toISOString(),
  };
}

export async function getSubscription(studioId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('inkflow_subscriptions')
    .select('*')
    .eq('studio_id', studioId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return mapSubscription(data);
}

export function getPlanLimits(plan: SubscriptionPlan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.solo;
}

export function hasFeature(plan: SubscriptionPlan, feature: string): boolean {
  const limits = PLAN_LIMITS[plan];
  return limits ? limits.features.includes(feature) : false;
}

export function canAddArtist(plan: SubscriptionPlan, currentCount: number): boolean {
  const limits = PLAN_LIMITS[plan];
  if (!limits) return false;
  if (limits.maxArtists === -1) return true;
  return currentCount < limits.maxArtists;
}

export function isSubscriptionActive(sub: Subscription | null): boolean {
  if (!sub) return false;
  return sub.status === 'active' || sub.status === 'trialing';
}
