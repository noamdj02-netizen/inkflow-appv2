import { Inbox, ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ProjectInboxRow } from './types';
import { BentoAvatar } from './BentoAvatar';
import {
  bentoBadge,
  bentoListBlock,
  bentoListDivided,
  bentoListItem,
  formatRelativeShort,
  glassPanel,
  microHover,
  statusChip,
  dashboardStatusBadge,
} from './bentoStyles';
import { dashboardTileIcon } from '../ui/dashboardChrome';

export interface BentoProjectInboxTileProps {
  requests: ProjectInboxRow[];
  onOpenRequests?: () => void;
  className?: string;
}

export function BentoProjectInboxTile({
  requests,
  onOpenRequests,
  className = '',
}: BentoProjectInboxTileProps) {
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
      transition={reduceMotion ? undefined : { ...itemMotion.transition, delay: 0.14 }}
      className={cn(glassPanel, 'flex flex-col p-4 sm:p-6', className)}
      aria-labelledby="bento-inbox-heading"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className={dashboardTileIcon}>
            <Inbox className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <div>
            <h2
              id="bento-inbox-heading"
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            >
              File projets · vitrine
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Demandes en attente (CRM)</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onOpenRequests ? (
            <button
              type="button"
              onClick={onOpenRequests}
              className={cn(microHover, dashboardTileIcon, 'size-11 border-0')}
              aria-label="Ouvrir les demandes"
            >
              <ArrowUpRight
                className="size-4 text-zinc-900 dark:text-zinc-100"
                strokeWidth={2}
                aria-hidden
              />
            </button>
          ) : null}
          <span className={cn(bentoBadge, dashboardStatusBadge.pending)}>
            {requests.length} en attente
          </span>
        </div>
      </div>

      {requests.length === 0 ? (
        <p className="mt-4 rounded-[20px] border-0 px-4 py-8 text-center text-xs text-zinc-500 dark:bg-white/[0.03] dark:text-[#737373]">
          Aucune demande projet en attente — ta vitrine est à jour sur ce flux.
        </p>
      ) : (
        <div className={cn(bentoListBlock, 'mt-4')}>
          <ul className={bentoListDivided}>
            {requests.map((req, i) => {
              const chip = statusChip('req', req.urgency);
              return (
                <motion.li
                  key={req.id}
                  {...(reduceMotion
                    ? {}
                    : {
                        initial: { opacity: 0 },
                        animate: { opacity: 1 },
                        transition: { delay: 0.11 + i * 0.04 },
                      })}
                  tabIndex={0}
                  className={cn(
                    bentoListItem,
                    microHover,
                    'outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30'
                  )}
                >
                  <BentoAvatar name={req.clientName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {req.clientName}
                    </p>
                    <p className="line-clamp-2 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                      {req.motif}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                      Reçu {formatRelativeShort(req.createdAt)}
                    </p>
                  </div>
                  <span className={cn(bentoBadge, chip.className)}>{chip.label}</span>
                </motion.li>
              );
            })}
          </ul>
        </div>
      )}
    </motion.article>
  );
}
