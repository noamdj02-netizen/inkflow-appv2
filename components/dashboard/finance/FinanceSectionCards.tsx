import { TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatEuroPrivacy } from '@/contexts/StudioPrivacyContext';

export interface FinanceSectionCardMetric {
  id: string;
  label: string;
  value: string;
  deltaPercent: number | null;
  trendLabel: string;
  footerHint: string;
  positiveIsGood?: boolean;
}

/** Grille KPI — copie exacte [dashboard-01](https://ui.shadcn.com/view/new-york-v4/dashboard-01). */
export const DASHBOARD_01_SECTION_GRID =
  'grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card';

function formatDelta(delta: number | null): string {
  if (delta == null || !Number.isFinite(delta)) return '—';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

function SectionCard({ metric }: { metric: FinanceSectionCardMetric }) {
  const up = (metric.deltaPercent ?? 0) >= 0;
  const TrendIcon = up ? TrendingUp : TrendingDown;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{metric.label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {metric.value}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">
            <TrendIcon aria-hidden />
            {formatDelta(metric.deltaPercent)}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {metric.trendLabel}
          <TrendIcon className="size-4 shrink-0" aria-hidden />
        </div>
        <div className="text-muted-foreground">{metric.footerHint}</div>
      </CardFooter>
    </Card>
  );
}

export interface FinanceSectionCardsProps {
  metrics: FinanceSectionCardMetric[];
  className?: string;
}

export function FinanceSectionCards({ metrics, className }: FinanceSectionCardsProps) {
  return (
    <div className={cn(DASHBOARD_01_SECTION_GRID, className)}>
      {metrics.map((metric) => (
        <SectionCard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}

export function computeMonthOverMonthDelta(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return null;
    return 100;
  }
  return ((current - previous) / previous) * 100;
}

export function buildFinanceSectionMetrics(args: {
  totalGlobal: number;
  totalDeposits: number;
  totalCash: number;
  pendingDeposits: number;
  completedCount: number;
  privacyMode: boolean;
  monthGlobal: { current: number; previous: number };
  monthDeposits: { current: number; previous: number };
  monthCash: { current: number; previous: number };
  monthPending: { current: number; previous: number };
}): FinanceSectionCardMetric[] {
  const {
    totalGlobal,
    totalDeposits,
    totalCash,
    pendingDeposits,
    completedCount,
    privacyMode,
    monthGlobal,
    monthDeposits,
    monthCash,
    monthPending,
  } = args;

  const globalDelta = computeMonthOverMonthDelta(monthGlobal.current, monthGlobal.previous);
  const depositsDelta = computeMonthOverMonthDelta(monthDeposits.current, monthDeposits.previous);
  const cashDelta = computeMonthOverMonthDelta(monthCash.current, monthCash.previous);
  const pendingDelta = computeMonthOverMonthDelta(monthPending.current, monthPending.previous);

  return [
    {
      id: 'global',
      label: 'Total encaissé',
      value: formatEuroPrivacy(totalGlobal, privacyMode),
      deltaPercent: globalDelta,
      trendLabel:
        globalDelta == null
          ? 'Stable ce mois-ci'
          : globalDelta >= 0
            ? 'En hausse vs mois dernier'
            : 'En baisse vs mois dernier',
      footerHint: 'RDV terminés + espèces',
    },
    {
      id: 'deposits',
      label: 'Acomptes reçus',
      value: formatEuroPrivacy(totalDeposits, privacyMode),
      deltaPercent: depositsDelta,
      trendLabel:
        depositsDelta == null
          ? 'Pas de comparaison'
          : depositsDelta >= 0
            ? 'Plus d’acomptes encaissés'
            : 'Moins d’acomptes ce mois',
      footerHint: 'Stripe · vitrine & book',
    },
    {
      id: 'cash',
      label: 'Espèces',
      value: formatEuroPrivacy(totalCash, privacyMode),
      deltaPercent: cashDelta,
      trendLabel:
        cashDelta == null
          ? 'Caisse stable'
          : cashDelta >= 0
            ? 'Caisse en progression'
            : 'Moins d’espèces ce mois',
      footerHint: 'Encaissements manuels',
    },
    {
      id: 'pending',
      label: 'En attente',
      value: formatEuroPrivacy(pendingDeposits, privacyMode),
      deltaPercent: pendingDelta,
      positiveIsGood: false,
      trendLabel:
        pendingDelta == null
          ? `${completedCount} RDV terminés`
          : pendingDelta >= 0
            ? 'Plus d’acomptes à relancer'
            : 'Moins de relances nécessaires',
      footerHint: 'Acomptes non payés · créneaux à sécuriser',
    },
  ];
}
