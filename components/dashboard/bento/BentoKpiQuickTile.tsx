import { BarChart3, ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { bentoKpiAmountStat, bentoListBlock, glassPanel, microHover } from './bentoStyles';

export interface BentoKpiQuickTileProps {
  monthlyRevenue: number;
  monthlyForecast: number;
  pendingDeposits: number;
  privacyMode: boolean;
  formatEuro: (n: number) => string;
  onOpenFinance?: () => void;
  className?: string;
}

export function BentoKpiQuickTile({
  monthlyRevenue,
  monthlyForecast,
  pendingDeposits,
  privacyMode,
  formatEuro,
  onOpenFinance,
  className = '',
}: BentoKpiQuickTileProps) {
  const reduceMotion = useReducedMotion();
  const itemMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { type: 'spring' as const, stiffness: 380, damping: 34 },
      };

  const safeRev = Number.isFinite(monthlyRevenue) ? monthlyRevenue : 0;
  const safeFore = Number.isFinite(monthlyForecast) ? monthlyForecast : 0;
  const safePend = Number.isFinite(pendingDeposits) ? pendingDeposits : 0;

  const cells = [
    { label: 'Revenu mois', value: privacyMode ? '••••' : formatEuro(safeRev) },
    { label: 'Prévision mois', value: privacyMode ? '••••' : formatEuro(safeFore) },
    {
      label: 'Acomptes en attente',
      value: privacyMode ? '••••' : formatEuro(Math.max(0, safePend)),
    },
  ] as const;

  return (
    <motion.article
      {...itemMotion}
      transition={reduceMotion ? undefined : { ...itemMotion.transition, delay: 0.06 }}
      className={cn(
        glassPanel,
        'flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6',
        className
      )}
      aria-labelledby="bento-kpi-heading"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200">
          <BarChart3 className="size-5" aria-hidden />
        </span>
        <div>
          <h2
            id="bento-kpi-heading"
            className="text-sm font-semibold text-zinc-900 dark:text-white"
          >
            Indicateurs rapides
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Vue mois — mêmes chiffres que le tableau de bord
          </p>
        </div>
      </div>

      <div
        className={cn(
          bentoListBlock,
          'flex flex-1 flex-col divide-y divide-zinc-100 sm:max-w-xl sm:flex-row sm:divide-x sm:divide-y-0 dark:divide-zinc-800'
        )}
      >
        {cells.map((c) => (
          <div key={c.label} className="flex-1 px-3 py-3 sm:px-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {c.label}
            </p>
            <p className={cn('mt-1', bentoKpiAmountStat)}>{c.value}</p>
          </div>
        ))}
      </div>

      {onOpenFinance ? (
        <button
          type="button"
          onClick={onOpenFinance}
          className={cn(
            microHover,
            'inline-flex min-h-11 shrink-0 items-center justify-center gap-1 self-stretch rounded-[20px] border-0 bg-white px-3 text-xs font-medium text-zinc-800 dark:bg-white/[0.05] dark:text-[#3b82f6] sm:self-center'
          )}
        >
          Détails
          <ArrowUpRight className="size-3.5 opacity-70" aria-hidden />
        </button>
      ) : null}
    </motion.article>
  );
}
