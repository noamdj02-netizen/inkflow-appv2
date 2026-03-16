/**
 * StatCard — Snow UI / ByeWind KPI Card
 * Fond BLANC pur (bg-white) avec texte NOIR pour contraste maximal
 * Inclut % d'évolution et mini sparkline optionnel
 */
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number;
  sparklineData?: number[];
  accentColor?: string;
  icon?: React.ReactNode;
  suffix?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  trend,
  sparklineData,
  accentColor = '#8ab4f8',
  suffix = '',
}) => {
  const hasTrend = trend !== undefined && trend !== null;
  const isPositive = hasTrend && trend >= 0;

  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 transition-all hover:border-[#d1d5db] hover:shadow-sm">
      {/* Label — texte noir sur fond blanc */}
      <p className="text-[13px] font-medium text-[#6b7280] mb-2">{label}</p>

      {/* Value row — texte noir sur fond blanc */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-semibold text-black tabular-nums tracking-tight">
            {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
          </span>
          {suffix && <span className="text-[15px] font-medium text-[#6b7280]">{suffix}</span>}
        </div>

        {/* Trend indicator */}
        {hasTrend && (
          <div className={`flex items-center gap-1 text-[13px] font-medium ${isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{isPositive ? '+' : ''}{trend}%</span>
          </div>
        )}
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-4 h-8 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData.map((v, i) => ({ v, i }))} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={accentColor}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

/**
 * StatCardDark — Variante sombre pour les cartes de graphiques
 * Fond bg-[#232329] avec bordure border-[#33333d]
 */
export const StatCardDark: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-[#232329] rounded-2xl border border-[#33333d] p-6 ${className}`}>
      <h3 className="text-[14px] font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  );
};
