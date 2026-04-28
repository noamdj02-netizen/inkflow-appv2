import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { AdminSparkline } from './adminSparkline';

export interface HeroMetricCardProps {
  label: string;
  value: string;
  trend: number;
  sparklineData: number[];
  period?: string;
}

export function HeroMetricCard({
  label,
  value,
  trend,
  sparklineData,
  period = '30j',
}: HeroMetricCardProps): React.ReactElement {
  const isPositive = trend >= 0;

  return (
    <div className="col-span-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6 sm:p-8 shadow-sm transition-all duration-300 hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-600">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-[200px] flex-1">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--admin-text-muted)]">
            <span className="h-2 w-2 rounded-full bg-[var(--admin-text-muted)]" />
            {label}
          </p>
          <h2 className="mb-2 font-sans text-4xl font-bold tabular-nums tracking-tight text-[var(--admin-text)] sm:text-5xl md:text-6xl">
            {value}
          </h2>
        </div>

        <div
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold tabular-nums ${
            isPositive
              ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200'
              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-300'
          }`}
        >
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span className="text-sm tabular-nums">
            {trend > 0 ? '+' : ''}
            {trend}%
          </span>
        </div>
      </div>

      <div className="mb-3 h-14 sm:h-16">
        <AdminSparkline
          data={sparklineData.length ? sparklineData : [0]}
          color="var(--admin-chart-line)"
          height={56}
        />
      </div>

      <p className="flex items-center gap-2 text-xs text-[var(--admin-text-muted)]">
        <span className="h-1 w-1 rounded-full bg-[var(--admin-text-muted)]" />
        Tendance {period}
      </p>
    </div>
  );
}
