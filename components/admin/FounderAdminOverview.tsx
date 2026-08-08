import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, UserX, Users } from 'lucide-react';
import type { FounderMetricsPayload } from '../../lib/founderMetrics';
import { ActivityChart } from './ActivityChart';
import { AlertCard, type FounderAlertItem } from './AlertCard';
import { HeroMetricCard } from './HeroMetricCard';
import { MetricCard } from './MetricCard';
import { TopStudios } from './TopStudios';

const PERIOD_OPTIONS = [
  { value: '7j', label: '7 derniers jours' },
  { value: '30j', label: '30 derniers jours' },
  { value: '90j', label: '90 derniers jours' },
  { value: '12m', label: '12 derniers mois' },
] as const;

function signupsTrendPercent(signups: { count: number }[]): number {
  if (signups.length < 2) return 0;
  const mid = Math.floor(signups.length / 2);
  const a = signups.slice(0, mid).reduce((s, x) => s + x.count, 0);
  const b = signups.slice(mid).reduce((s, x) => s + x.count, 0);
  if (a === 0) return b > 0 ? 100 : 0;
  return Math.round(((b - a) / a) * 100);
}

function buildMrrSparkline(mrr: number): number[] {
  const base = Math.max(0, mrr);
  return Array.from({ length: 7 }, (_, i) => Math.round(base * (0.92 + (i / 6) * 0.08)));
}

interface FounderAdminOverviewProps {
  data: FounderMetricsPayload;
  revealSensitive: boolean;
  period: (typeof PERIOD_OPTIONS)[number]['value'];
  onPeriodChange: (p: (typeof PERIOD_OPTIONS)[number]['value']) => void;
}

function maskEuro(reveal: boolean, value: number): string {
  if (!reveal) return '•••• €';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function FounderAdminOverview({
  data,
  revealSensitive,
  period,
  onPeriodChange,
}: FounderAdminOverviewProps): React.ReactElement {
  const trend = useMemo(
    () => signupsTrendPercent(data.activity.signupsByDay),
    [data.activity.signupsByDay]
  );
  const mrrSpark = useMemo(
    () => buildMrrSparkline(data.kpis.mrrEstimatedEur),
    [data.kpis.mrrEstimatedEur]
  );
  const arrSpark = useMemo(
    () => buildMrrSparkline(data.kpis.mrrEstimatedEur * 12),
    [data.kpis.mrrEstimatedEur]
  );

  const alerts: FounderAlertItem[] = useMemo(() => {
    const out: FounderAlertItem[] = [];
    if (data.alerts.studiosStuckOnboarding > 0) {
      out.push({
        id: 'onb',
        title: 'Onboarding bloqué (>7j)',
        count: data.alerts.studiosStuckOnboarding,
        severity: 'error',
      });
    }
    if (data.alerts.unpaidDepositsOver48h > 0) {
      out.push({
        id: 'dep',
        title: 'Acomptes impayés >48h',
        count: data.alerts.unpaidDepositsOver48h,
        severity: 'warning',
      });
    }
    if (data.health.paymentsFailedMonth > 0) {
      out.push({
        id: 'pay',
        title: 'Paiements échoués (mois)',
        count: data.health.paymentsFailedMonth,
        severity: 'warning',
      });
    }
    return out;
  }, [data.alerts, data.health.paymentsFailedMonth]);

  const topRows = useMemo(
    () =>
      data.growth.topStudios.slice(0, 5).map((r) => ({
        id: r.studioId,
        slug: r.slug,
        bookings: r.bookings30d,
      })),
    [data.growth.topStudios]
  );

  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? period;

  return (
    <div className="mb-8 space-y-6 founder-print-hide">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="mb-1 font-sans text-2xl font-bold tracking-tight text-[var(--admin-text)]">
            InkFlow Admin
          </h2>
          <p className="text-sm text-[var(--admin-text-muted)]">
            Vue d&apos;ensemble · données Edge — mêmes KPIs que les sections détaillées · 2026
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={period}
            onChange={(e) =>
              onPeriodChange(e.target.value as (typeof PERIOD_OPTIONS)[number]['value'])
            }
            className="cursor-pointer rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-4 py-2 text-sm text-[var(--admin-text)] transition-colors hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-400/40"
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <HeroMetricCard
          label="MRR SaaS estimé (InkFlow)"
          value={maskEuro(revealSensitive, data.kpis.mrrEstimatedEur)}
          trend={trend}
          sparklineData={revealSensitive ? mrrSpark : mrrSpark.map(() => 0)}
          period={periodLabel}
        />

        <MetricCard
          icon={TrendingUp}
          label="ARR indicatif"
          value={maskEuro(revealSensitive, data.kpis.mrrEstimatedEur * 12)}
          sparklineData={revealSensitive ? arrSpark : []}
        />
        <MetricCard
          icon={Users}
          label="Studios actifs (7j)"
          value={data.kpis.studiosActive7d}
          sparklineData={[
            0,
            0,
            0,
            data.kpis.studiosActive7d,
            data.kpis.studiosActive7d,
            data.kpis.studiosActive7d,
            data.kpis.studiosActive7d,
          ]}
        />
        <MetricCard
          icon={DollarSign}
          label="Acomptes écosystème (mois)"
          value={maskEuro(revealSensitive, data.kpis.depositsMonthEur)}
          sparklineData={revealSensitive ? buildMrrSparkline(data.kpis.depositsMonthEur) : []}
          accentColor="var(--admin-chart-line)"
        />
        <MetricCard
          icon={UserX}
          label="Churn abonnements (mois)"
          value={data.growth.churnSubscriptionsMonth}
          sparklineData={[data.growth.churnSubscriptionsMonth, data.growth.churnSubscriptionsMonth]}
          accentColor="var(--admin-chart-muted)"
        />

        <div className="lg:col-span-full">
          <ActivityChart signupsByDay={data.activity.signupsByDay} period={periodLabel} />
        </div>

        <div className="lg:col-span-3">
          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
            <h3 className="mb-2 text-sm font-semibold text-[var(--admin-text)]">
              Détail métriques
            </h3>
            <p className="text-sm leading-relaxed text-[var(--admin-text-muted)]">
              Les graphiques détaillés, exports CSV et alertes complètes suivent dans les sections
              ci-dessous. La période ci-dessus est indicative pour le style dashboard importé ; les
              agrégats restent alignés sur les définitions Edge (Paris / UTC selon métrique).
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1">
          <AlertCard alerts={alerts} />
          <TopStudios studios={topRows} />
        </div>
      </div>
    </div>
  );
}
