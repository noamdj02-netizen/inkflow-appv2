import { CalendarClock, ArrowUpRight, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TodaySlot } from './types';
import { BentoAvatar } from './BentoAvatar';
import {
  bentoBadge,
  bentoListBlock,
  bentoListDivided,
  bentoListItem,
  formatTimeRange,
  glassPanel,
  microHover,
  statusChip,
} from './bentoStyles';
import { dashboardTileIcon } from '../ui/dashboardChrome';

export interface BentoAgendaTodayTileProps {
  todayLabel: string;
  slots: TodaySlot[];
  onOpenAgenda?: () => void;
  onNewAppointment: () => void;
  onOpenFlashTab: () => void;
  className?: string;
}

export function BentoAgendaTodayTile({
  todayLabel,
  slots,
  onOpenAgenda,
  onNewAppointment,
  onOpenFlashTab,
  className = '',
}: BentoAgendaTodayTileProps) {
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
      transition={reduceMotion ? undefined : { ...itemMotion.transition, delay: 0.04 }}
      className={cn(glassPanel, 'flex min-h-[280px] flex-col p-4 sm:p-6', className)}
      aria-labelledby="bento-agenda-heading"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={dashboardTileIcon}>
            <CalendarClock className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <div>
            <h2
              id="bento-agenda-heading"
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Planning du jour
            </h2>
            <p className="text-xs capitalize text-zinc-500 dark:text-zinc-400">{todayLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onOpenAgenda ? (
            <button
              type="button"
              onClick={onOpenAgenda}
              className={cn(microHover, dashboardTileIcon, 'size-11 border-0')}
              aria-label="Ouvrir l’agenda"
            >
              <ArrowUpRight
                className="size-4 text-zinc-900 dark:text-zinc-100"
                strokeWidth={2}
                aria-hidden
              />
            </button>
          ) : null}
          <span
            className={cn(
              bentoBadge,
              'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300'
            )}
          >
            {slots.length} créneau{slots.length > 1 ? 'x' : ''}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-1 flex-col overflow-y-auto pr-1">
        {slots.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 px-4 py-10 text-center dark:border-zinc-800">
            <Sparkles className="mb-2 size-8 text-zinc-400 dark:text-zinc-500" aria-hidden />
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Journée plus légère
            </p>
            <p className="mt-1 max-w-xs text-xs text-zinc-500 dark:text-zinc-400">
              Ajoute un rendez-vous ou mets tes flashs en avant pour remplir l’agenda.
            </p>
            <div className="mt-4 flex w-full max-w-xs flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={onNewAppointment}
                className={cn(
                  microHover,
                  'min-h-11 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100'
                )}
              >
                Nouveau RDV
              </button>
              <button
                type="button"
                onClick={onOpenFlashTab}
                className={cn(
                  microHover,
                  'min-h-11 rounded-xl border border-zinc-100 bg-white px-4 py-2 text-sm font-medium text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100'
                )}
              >
                Flashs vitrine
              </button>
            </div>
          </div>
        ) : (
          <div className={bentoListBlock}>
            <ul className={bentoListDivided}>
              {slots.map((slot, i) => {
                const chip = statusChip('slot', slot.status);
                return (
                  <motion.li
                    key={slot.id}
                    {...(reduceMotion
                      ? {}
                      : {
                          initial: { opacity: 0 },
                          animate: { opacity: 1 },
                          transition: { delay: 0.07 + i * 0.04 },
                        })}
                    className={cn(bentoListItem, 'cursor-default')}
                  >
                    <BentoAvatar name={slot.clientName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {slot.title}
                      </p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {slot.clientName}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-mono text-xs font-medium tabular-nums text-zinc-600 dark:text-zinc-300">
                        {formatTimeRange(slot.start, slot.end)}
                      </span>
                      <span className={cn(bentoBadge, chip.className)}>{chip.label}</span>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </motion.article>
  );
}
