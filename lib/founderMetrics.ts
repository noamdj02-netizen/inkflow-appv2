/**
 * Client Founder Dashboard — appelle l’Edge Function `admin-founder-metrics`.
 * Les e-mails d’équipe @ink-flow.me / @inkflow.me sont autorisés sans variable Vite.
 * Sinon : `VITE_FOUNDER_ADMIN_EMAILS` alignée sur `FOUNDER_ADMIN_EMAILS` (Edge).
 */

import { isInkflowInternalStaffEmail } from './inkflowInternalStaff';

export interface FounderMetricsPayload {
  generatedAt: string;
  kpis: {
    /** Comptes Supabase Auth. -1 = indisponible (erreur listUsers). */
    totalAuthUsers: number;
    totalStudios: number;
    /** Fiches CRM (inkflow_clients), toutes studios confondus. */
    crmClientsTotal: number;
    subscribedActive: number;
    subscribedTrialing: number;
    /** MRR estimé = somme des abonnements SaaS InkFlow (plans × studios payants). */
    mrrEstimatedEur: number;
    studiosActive7d: number;
    bookingsTodayParis: number;
    bookingsCreated30d: number;
    /** Argent des clients vers les studios (acomptes) — pas le MRR InkFlow. */
    depositsMonthEur: number;
  };
  health: {
    paymentsFailedMonth: number;
    paymentsPendingStale7d: number;
  };
  activity: {
    signupsByDay: { date: string; count: number }[];
    onboardingActivationRate: number;
    onboardingStepDistribution: { step: string; count: number }[];
    projectRequestsByStatus: { status: string; count: number }[];
    projectAcceptanceRate: number | null;
  };
  alerts: {
    studiosStuckOnboarding: number;
    unpaidDepositsOver48h: number;
    suspiciousAuthNote: string;
    studiosInactive14d: number;
    studiosNoFlashAfter48h: number;
    studiosNoStripeAfter72h: number;
  };
  growth: {
    churnSubscriptionsMonth: number;
    planDistribution: { plan: string; count: number }[];
    topStudios: { studioId: string; slug: string; bookings30d: number }[];
    geography: { city: string; studioCount: number; lat: number | null; lng: number | null }[];
  };
}

function founderEmailsFromEnv(): Set<string> {
  const raw = (import.meta.env.VITE_FOUNDER_ADMIN_EMAILS as string | undefined) ?? '';
  return new Set(raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
}

/**
 * Autorise l’UI `/admin` côté client.
 * - E-mails **@ink-flow.me** / **@inkflow.me** : toujours autorisés (équipe produit, sans copier dans VITE).
 * - Si `VITE_FOUNDER_ADMIN_EMAILS` est **vide** : pas de blocage client — l’Edge tranche.
 * - Si renseignée : e-mail listé **ou** domaine équipe ci-dessus.
 */
export function isFounderAllowlistedEmail(email: string | undefined | null): boolean {
  if (!email?.trim()) return false;
  if (isInkflowInternalStaffEmail(email)) return true;
  const raw = (import.meta.env.VITE_FOUNDER_ADMIN_EMAILS as string | undefined) ?? '';
  if (!raw.trim()) return true;
  return founderEmailsFromEnv().has(email.trim().toLowerCase());
}

/** Liste client explicitement configurée (pour messages d’aide / diagnostics). */
export function isFounderClientAllowlistConfigured(): boolean {
  const raw = (import.meta.env.VITE_FOUNDER_ADMIN_EMAILS as string | undefined) ?? '';
  return raw.trim().length > 0;
}

export async function fetchFounderMetrics(accessToken: string): Promise<FounderMetricsPayload> {
  const base = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const url = `${base}/functions/v1/admin-founder-metrics`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, ''),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    let err = text;
    try {
      const j = JSON.parse(text) as { error?: string };
      err = j.error || text;
    } catch {
      /* ignore */
    }
    throw new Error(err || `HTTP ${res.status}`);
  }
  return normalizeFounderMetricsPayload(JSON.parse(text) as Partial<FounderMetricsPayload>);
}

/** Tolère d’anciennes réponses Edge avant extension des KPIs. */
export function normalizeFounderMetricsPayload(raw: Partial<FounderMetricsPayload>): FounderMetricsPayload {
  const k = (raw.kpis ?? {}) as Partial<FounderMetricsPayload['kpis']>;
  const h = raw.health;
  return {
    generatedAt: raw.generatedAt ?? new Date().toISOString(),
    kpis: {
      totalAuthUsers: typeof k.totalAuthUsers === 'number' ? k.totalAuthUsers : -1,
      totalStudios: k.totalStudios ?? 0,
      crmClientsTotal: k.crmClientsTotal ?? 0,
      subscribedActive: k.subscribedActive ?? 0,
      subscribedTrialing: k.subscribedTrialing ?? 0,
      mrrEstimatedEur: k.mrrEstimatedEur ?? 0,
      studiosActive7d: k.studiosActive7d ?? 0,
      bookingsTodayParis: k.bookingsTodayParis ?? 0,
      bookingsCreated30d: k.bookingsCreated30d ?? 0,
      depositsMonthEur: k.depositsMonthEur ?? 0,
    },
    health: {
      paymentsFailedMonth: h?.paymentsFailedMonth ?? 0,
      paymentsPendingStale7d: h?.paymentsPendingStale7d ?? 0,
    },
    activity: {
      signupsByDay: raw.activity?.signupsByDay ?? [],
      onboardingActivationRate: raw.activity?.onboardingActivationRate ?? 0,
      onboardingStepDistribution: raw.activity?.onboardingStepDistribution ?? [],
      projectRequestsByStatus: raw.activity?.projectRequestsByStatus ?? [],
      projectAcceptanceRate: raw.activity?.projectAcceptanceRate ?? null,
    },
    alerts: {
      studiosStuckOnboarding: raw.alerts?.studiosStuckOnboarding ?? 0,
      unpaidDepositsOver48h: raw.alerts?.unpaidDepositsOver48h ?? 0,
      suspiciousAuthNote: raw.alerts?.suspiciousAuthNote ?? '',
      studiosInactive14d: raw.alerts?.studiosInactive14d ?? 0,
      studiosNoFlashAfter48h: raw.alerts?.studiosNoFlashAfter48h ?? 0,
      studiosNoStripeAfter72h: raw.alerts?.studiosNoStripeAfter72h ?? 0,
    },
    growth: {
      churnSubscriptionsMonth: raw.growth?.churnSubscriptionsMonth ?? 0,
      planDistribution: raw.growth?.planDistribution ?? [],
      topStudios: raw.growth?.topStudios ?? [],
      geography: raw.growth?.geography ?? [],
    },
  };
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]): void {
  const esc = (cell: string | number | null | undefined) => {
    const s = cell == null ? '' : String(cell);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
