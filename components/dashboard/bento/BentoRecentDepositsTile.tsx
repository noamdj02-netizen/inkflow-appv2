import { CreditCard, ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { StripeDepositRow } from './types';
import { BentoAvatar } from './BentoAvatar';
import {
  bentoBadge,
  bentoListBlock,
  bentoListDivided,
  bentoListItem,
  formatMoney,
  formatRelativeShort,
  glassPanel,
  microHover,
  statusChip,
  dashboardStatusBadge,
} from './bentoStyles';
import { dashboardTileIcon } from '../ui/dashboardChrome';

export interface BentoRecentDepositsTileProps {
  deposits: StripeDepositRow[];
  onOpenFinance?: () => void;
  className?: string;
}

export function BentoRecentDepositsTile({
  deposits,
  onOpenFinance,
  className = '',
}: BentoRecentDepositsTileProps) {
  const reduceMotion = useReducedMotion();

  const itemMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { type: 'spring' as const, stiffness: 380, damping: 32 },
      };

  return (
    <motion.article
      {...itemMotion}
      transition={reduceMotion ? undefined : { ...itemMotion.transition, delay: 0.1 }}
      className={cn(glassPanel, 'flex flex-col p-4 sm:p-6', className)}
      aria-labelledby="bento-deposits-heading"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className={dashboardTileIcon}>
            <CreditCard className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <div>
            <h2
              id="bento-deposits-heading"
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Derniers acomptes
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Encaissés sur les rendez-vous (aperçu)
            </p>
          </div>
        </div>
        {onOpenFinance ? (
          <button
            type="button"
            onClick={onOpenFinance}
            className={cn(
              microHover,
              'inline-flex min-h-11 items-center gap-1 rounded-xl border border-zinc-100 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200'
            )}
          >
            Finance
            <ArrowUpRight className="size-3.5 opacity-70" aria-hidden />
          </button>
        ) : null}
      </div>

      {deposits.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Aucun acompte récent dans cette liste — les paiements Stripe apparaîtront ici dès
          encaissement.
        </p>
      ) : (
        <div className={cn(bentoListBlock, 'mt-4')}>
          <ul className={bentoListDivided}>
            {deposits.slice(0, 4).map((pay, i) => {
              const chip = statusChip('pay', pay.status);
              return (
                <motion.li
                  key={pay.id}
                  {...(reduceMotion
                    ? {}
                    : {
                        initial: { opacity: 0 },
                        animate: { opacity: 1 },
                        transition: { delay: 0.09 + i * 0.05 },
                      })}
                  className={bentoListItem}
                >
                  <BentoAvatar name={pay.clientLabel} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {pay.clientLabel}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatRelativeShort(pay.receivedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      +{formatMoney(pay.amountCents, pay.currency)}
                    </span>
                    <span className={cn(bentoBadge, chip.className)}>{chip.label}</span>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      )}
    </motion.article>
  );
}
