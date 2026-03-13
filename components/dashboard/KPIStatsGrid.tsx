/**
 * Grille de KPIs / Statistiques pour tableau de bord SaaS.
 * 4 cartes horizontales : titre gris, valeur en gras, tendance, icône filigrane.
 */
import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export interface KPICardItem {
  /** Titre court (ex: "Acomptes reçus") */
  title: string;
  /** Valeur affichée (ex: "1 240€") */
  value: string | number;
  /** Tendance optionnelle (ex: "+12%", "-5%") — vert si positif, rouge si négatif */
  trend?: string;
  /** Icône en filigrane (coin supérieur droit) */
  icon: LucideIcon;
}

interface KPIStatsGridProps {
  items: KPICardItem[];
  /** Nombre de colonnes (défaut: 4) */
  columns?: 2 | 3 | 4;
}

function parseTrend(trend: string): { value: string; isPositive: boolean } {
  const match = trend.match(/^([+-]?\d+(?:[.,]\d+)?%?)$/);
  if (!match) return { value: trend, isPositive: !trend.startsWith('-') };
  const val = trend.trim();
  const isPositive = val.startsWith('+') || (val.startsWith('0') && !val.includes('-'));
  return { value: val, isPositive };
}

export const KPIStatsGrid: React.FC<KPIStatsGridProps> = ({ items, columns = 4 }) => {
  const gridCols = columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : columns === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {items.map((item, idx) => {
        const Icon = item.icon;
        const trendParsed = item.trend ? parseTrend(item.trend) : null;
        return (
          <div
            key={idx}
            className="relative overflow-hidden rounded-2xl border border-[#E5E7EB] dark:border-white/5 bg-white dark:bg-zinc-900 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-colors"
          >
            {/* Icône filigrane — coin supérieur droit */}
            <div className="absolute top-3 right-3 opacity-[0.12] dark:opacity-[0.08] pointer-events-none">
              <Icon className="w-10 h-10 text-zinc-900 dark:text-white" strokeWidth={1.5} />
            </div>

            {/* Titre court en gris clair */}
            <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 mb-1 truncate pr-10">
              {item.title}
            </p>

            {/* Valeur numérique en grand et gras (tabular-nums pour alignement) */}
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight tabular-nums">
              {item.value}
            </div>

            {/* Indicateur de tendance */}
            {trendParsed && (
              <div className="mt-2 flex items-center gap-1">
                {trendParsed.isPositive ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500 flex-shrink-0" strokeWidth={2} />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 flex-shrink-0" strokeWidth={2} />
                )}
                <span
                  className={`text-sm font-semibold ${
                    trendParsed.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {trendParsed.value}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
