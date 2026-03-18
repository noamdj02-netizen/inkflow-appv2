/**
 * Graphique linéaire interactif d'évolution des revenus mensuels.
 * Ligne bleu électrique, dégradé translucide, tooltip élégant, sélecteur de période.
 */
import React, { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
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
  hideGrid?: boolean;
  compact?: boolean;
  height?: number;
  onPeriodChange?: (total: number, trend: number | null) => void;
}

function computeChartData(appointments: Appointment[], period: RevenuePeriod, totalRevenue: number): { month: string; monthFull: string; revenue: number }[] {
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
        .reduce((sum, a) => sum + (a.depositPaid ? (a.deposit || 0) : (a.price || 0)), 0);
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
      .reduce((sum, a) => sum + (a.depositPaid ? (a.deposit || 0) : (a.price || 0)), 0);
    return {
      month: MONTH_LABELS[d.getMonth()],
      monthFull: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      revenue: rev,
    };
  });
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length || !payload[0].payload) return null;
  const { monthFull, revenue } = payload[0].payload as { monthFull: string; revenue: number };
  return (
    <div className="rounded-xl bg-zinc-900 dark:bg-zinc-950 px-4 py-3 shadow-xl border border-zinc-700/50">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">{monthFull}</p>
      <p className="text-lg font-bold text-white tabular-nums">{revenue.toLocaleString('fr-FR')}€</p>
    </div>
  );
}

const formatYAxis = (v: number) => {
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k€`;
  return `${v}€`;
};

export const RevenueChart: React.FC<RevenueChartProps> = ({
  appointments,
  totalRevenue,
  hideGrid = false,
  compact = false,
  height = 200,
  onPeriodChange,
}) => {
  const [period, setPeriod] = useState<RevenuePeriod>('6M');

  const chartData = useMemo(() => {
    return computeChartData(appointments, period, totalRevenue);
  }, [appointments, totalRevenue, period]);

  // Notifie le parent du total de la période et de la tendance
  React.useEffect(() => {
    if (!onPeriodChange) return;
    const total = chartData.reduce((s, d) => s + d.revenue, 0);
    const half = Math.floor(chartData.length / 2);
    const firstHalf = chartData.slice(0, half).reduce((s, d) => s + d.revenue, 0);
    const secondHalf = chartData.slice(half).reduce((s, d) => s + d.revenue, 0);
    const trend = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : null;
    onPeriodChange(total, trend);
  }, [chartData, onPeriodChange]);

  const periodLabels: { key: RevenuePeriod; label: string }[] = [
    { key: '1M', label: '1M' },
    { key: '6M', label: '6M' },
    { key: '1A', label: '1A' },
  ];

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 100);

  if (compact || hideGrid) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-end gap-1 mb-4">
          {periodLabels.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                period === key
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                  : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ height: height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueChartGradient-clean" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                stroke="#A1A1AA"
                style={{ fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis hide domain={[0, maxRevenue * 1.1]} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={2.5}
                fill="url(#revenueChartGradient-clean)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-end gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 w-fit ml-auto mb-4">
        {periodLabels.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriod(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              period === key
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueChartGradient-overview" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-zinc-800" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#9CA3AF"
              className="dark:stroke-zinc-500"
              style={{ fontSize: 11, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              dy={8}
            />
            <YAxis
              stroke="#9CA3AF"
              className="dark:stroke-zinc-500"
              style={{ fontSize: 11, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={formatYAxis}
              domain={[0, maxRevenue * 1.1]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={2.5}
              fill="url(#revenueChartGradient-overview)"
              dot={false}
              activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
