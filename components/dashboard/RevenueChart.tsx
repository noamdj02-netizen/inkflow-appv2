/**
 * Graphique linéaire interactif d'évolution des revenus mensuels.
 * Ligne bleu électrique #2563EB, dégradé translucide, tooltip élégant, sélecteur de période.
 */
import React, { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import type { Appointment } from '../../types';

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export type RevenuePeriod = '1M' | '6M' | '1A';

interface RevenueChartProps {
  appointments: Appointment[];
  totalRevenue: number;
}

function computeChartData(appointments: Appointment[], period: RevenuePeriod): { month: string; monthFull: string; revenue: number }[] {
  const now = new Date();
  const toStr = (d: Date) => d.toISOString().split('T')[0];

  if (period === '1M') {
    const weeks: { month: string; monthFull: string; revenue: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - 7 * (i + 1));
      const end = new Date(now);
      end.setDate(end.getDate() - 7 * i);
      const startStr = toStr(start);
      const endStr = toStr(end);
      const rev = appointments
        .filter(a => a.date >= startStr && a.date <= endStr && (a.depositPaid || a.status === 'completed'))
        .reduce((sum, a) => sum + (a.depositPaid ? a.deposit : a.price || 0), 0);
      weeks.push({
        month: `S${4 - i}`,
        monthFull: `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`,
        revenue: rev,
      });
    }
    return weeks;
  }

  const monthsCount = period === '6M' ? 6 : 12;
  return Array.from({ length: monthsCount }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - monthsCount + 1 + i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const rev = appointments
      .filter(a => a.date.startsWith(monthStr) && (a.depositPaid || a.status === 'completed'))
      .reduce((sum, a) => sum + (a.depositPaid ? a.deposit : a.price || 0), 0);
    return {
      month: MONTH_LABELS[d.getMonth()],
      monthFull: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      revenue: rev,
    };
  });
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length || !payload[0].payload) return null;
  const { monthFull, revenue } = payload[0].payload as { monthFull: string; revenue: number };
  return (
    <div className="rounded-xl bg-zinc-900 dark:bg-zinc-950 px-4 py-3 shadow-xl border border-zinc-700/50">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">{monthFull}</p>
      <p className="text-lg font-bold text-white">{revenue}€</p>
    </div>
  );
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ appointments, totalRevenue }) => {
  const [period, setPeriod] = useState<RevenuePeriod>('6M');

  const chartData = useMemo(() => {
    const data = computeChartData(appointments, period);
    if (data.length === 0) {
      const now = new Date();
      const monthsCount = period === '1M' ? 4 : period === '6M' ? 6 : 12;
      return Array.from({ length: monthsCount }, (_, i) => {
        const d = period === '1M'
          ? new Date(now.getTime() - 7 * (monthsCount - 1 - i) * 24 * 60 * 60 * 1000)
          : new Date(now.getFullYear(), now.getMonth() - monthsCount + 1 + i, 1);
        return {
          month: period === '1M' ? `S${i + 1}` : MONTH_LABELS[d.getMonth()],
          monthFull: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
          revenue: Math.round((totalRevenue * (i + 1)) / monthsCount),
        };
      });
    }
    return data;
  }, [appointments, totalRevenue, period]);

  const periodLabels: { key: RevenuePeriod; label: string }[] = [
    { key: '1M', label: '1M' },
    { key: '6M', label: '6M' },
    { key: '1A', label: '1A' },
  ];

  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-none overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
          <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">Évolution du revenu</span>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 self-start">
          {periodLabels.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={`px-3 py-2.5 sm:py-1.5 text-[13px] font-medium rounded-md transition-colors min-h-[44px] sm:min-h-0 ${
                period === key
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[200px] sm:h-[220px] -mx-2 sm:mx-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueChartGradient-overview" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="var(--chart-text)"
              style={{ fontSize: 12, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--chart-text)"
              style={{ fontSize: 12, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(v) => `${v}€`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2563EB', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2563EB"
              strokeWidth={3}
              fill="url(#revenueChartGradient-overview)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
