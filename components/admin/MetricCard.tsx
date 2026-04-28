import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { AdminSparkline } from './adminSparkline';

export interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sparklineData?: number[];
  accentColor?: string;
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  sparklineData,
  accentColor = 'var(--admin-chart-line)',
}: MetricCardProps): React.ReactElement {
  return (
    <div className="group cursor-pointer rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6 transition-all duration-200 hover:border-zinc-300 hover:shadow-sm dark:hover:border-zinc-600">
      <div className="mb-4 flex items-center justify-between">
        <Icon className="h-5 w-5 text-[var(--admin-text-muted)] transition-colors group-hover:text-[var(--admin-text)]" />
      </div>
      <p className="mb-1 text-sm text-[var(--admin-text-muted)]">{label}</p>
      <p className="mb-4 font-sans text-3xl font-bold tabular-nums tracking-tight text-[var(--admin-text)]">
        {value}
      </p>
      {sparklineData && sparklineData.length > 0 ? (
        <div className="-mx-2 h-10">
          <AdminSparkline data={sparklineData} color={accentColor} height={40} />
        </div>
      ) : null}
    </div>
  );
}
