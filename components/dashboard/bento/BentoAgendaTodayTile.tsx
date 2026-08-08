import { useMemo } from 'react';
import { CalendarClock, ArrowUpRight, PenLine, UserPlus, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { DayClientPreview, QuickClientRow, TodaySlot } from './types';
import { BentoAvatar } from './BentoAvatar';
import { ClientPhotoAvatar } from '@/components/common/ClientPhotoAvatar';
import {
  bentoActionBtn,
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
  /** Journée vide : 2–3 clients (jours 2 & 3 du mois ou prochains RDV) avec photo. */
  dayPreviewClients?: DayClientPreview[];
  /** Si journée vide : clients du studio pour RDV / CRM rapide. */
  quickClients?: QuickClientRow[];
  onOpenAgenda?: () => void;
  onNewAppointment: () => void;
  onNewClient?: () => void;
  /** Ouvre la fiche client + encaissement pour ce RDV. */
  onOpenAppointmentPreview?: (appointmentId: string) => void;
  onOpenFlashTab: () => void;
  className?: string;
}

export function BentoAgendaTodayTile({
  todayLabel,
  slots,
  dayPreviewClients = [],
  quickClients = [],
  onOpenAgenda,
  onNewAppointment,
  onNewClient,
  onOpenAppointmentPreview,
  onOpenFlashTab,
  className = '',
}: BentoAgendaTodayTileProps) {
  const reduceMotion = useReducedMotion();
  const hasToday = slots.length > 0;
  const hasDayPreview = dayPreviewClients.length > 0;
  const hasClients = quickClients.length > 0;
  const showEmptyHub = !hasToday;

  const previewDaysLabel = useMemo(() => {
    if (!hasDayPreview) return '';
    const days = [...new Set(dayPreviewClients.map((c) => c.date.split('-')[2]))]
      .filter(Boolean)
      .map((d) => String(Number(d)))
      .join(' & ');
    const first = dayPreviewClients[0]?.date;
    if (!first) return 'Prochains clients';
    const month = new Date(`${first}T12:00:00`).toLocaleDateString('fr-FR', { month: 'long' });
    return days ? `Clients — ${days} ${month}` : 'Prochains clients';
  }, [dayPreviewClients, hasDayPreview]);

  const itemMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { type: 'spring' as const, stiffness: 380, damping: 32 },
      };

  const badgeCount = hasToday
    ? slots.length
    : hasDayPreview
      ? dayPreviewClients.length
      : quickClients.length;

  const badgeLabel =
    badgeCount > 0
      ? hasToday
        ? badgeCount === 1
          ? '1 créneau'
          : `${badgeCount} créneaux`
        : badgeCount === 1
          ? '1 client'
          : `${badgeCount} clients`
      : 'Journée libre';

  const subtitle = hasToday ? todayLabel : 'Planifie un RDV ou repère un client à relancer.';

  return (
    <motion.article
      {...itemMotion}
      transition={reduceMotion ? undefined : { ...itemMotion.transition, delay: 0.04 }}
      className={cn(
        glassPanel,
        'flex min-h-0 flex-col p-4 max-md:overflow-visible sm:p-6 md:min-h-[280px]',
        className
      )}
      aria-labelledby="bento-agenda-heading"
    >
      <header className="space-y-3 border-b border-zinc-100/90 pb-4 dark:border-zinc-800/80">
        <div className="flex items-start gap-3">
          <span className={cn(dashboardTileIcon, 'size-11 rounded-2xl')}>
            <CalendarClock className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="bento-agenda-heading"
                className="font-display text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[17px]"
              >
                {hasToday ? 'Planning du jour' : 'Planning & clients'}
              </h2>
              <span
                className={cn(
                  bentoBadge,
                  badgeCount > 0
                    ? hasToday
                      ? 'bg-blue-50 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300'
                      : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300'
                )}
              >
                {badgeLabel}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-[13px]">
              {subtitle}
            </p>
          </div>
        </div>

        {onOpenAgenda ? (
          <div className="flex flex-wrap gap-2 pl-[52px] sm:pl-[56px]">
            <button
              type="button"
              onClick={onOpenAgenda}
              className={cn(
                microHover,
                'inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-800 dark:border-zinc-700/80 dark:bg-zinc-900/60 dark:text-zinc-100'
              )}
            >
              Voir l&apos;agenda
              <ArrowUpRight className="size-3.5 opacity-70" aria-hidden />
            </button>
            {!hasToday ? (
              <button
                type="button"
                onClick={onNewAppointment}
                className={cn(microHover, bentoActionBtn, 'min-h-11 px-3.5 py-2 text-xs')}
              >
                Nouveau RDV
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="mt-4 flex flex-col max-md:overflow-visible md:min-h-0 md:mt-5 md:flex-1 md:overflow-y-auto md:pr-1 [-webkit-overflow-scrolling:touch]">
        {hasToday ? (
          <div className={bentoListBlock}>
            <ul className={bentoListDivided}>
              {slots.map((slot, i) => {
                const chip = statusChip('slot', slot.status);
                const rowInner = (
                  <>
                    <BentoAvatar name={slot.clientName} src={slot.avatarUrl} />
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
                  </>
                );
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
                  >
                    {onOpenAppointmentPreview ? (
                      <button
                        type="button"
                        onClick={() => onOpenAppointmentPreview(slot.id)}
                        className={cn(
                          bentoListItem,
                          'w-full text-left active:scale-[0.99] transition-all hover:bg-zinc-50/80 dark:hover:bg-white/[0.04]'
                        )}
                      >
                        {rowInner}
                      </button>
                    ) : (
                      <div className={cn(bentoListItem, 'cursor-default')}>{rowInner}</div>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          </div>
        ) : showEmptyHub ? (
          <div className="flex flex-1 flex-col gap-4">
            {hasDayPreview ? (
              <div className="space-y-3">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                  {previewDaysLabel}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {dayPreviewClients.map((client, i) => {
                    const chip = statusChip('slot', client.status);
                    return (
                      <motion.li
                        key={client.appointmentId}
                        {...(reduceMotion
                          ? {}
                          : {
                              initial: { opacity: 0, y: 8 },
                              animate: { opacity: 1, y: 0 },
                              transition: { delay: 0.05 + i * 0.05 },
                            })}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenAppointmentPreview) {
                              onOpenAppointmentPreview(client.appointmentId);
                            } else {
                              onNewAppointment();
                            }
                          }}
                          className={cn(
                            'flex w-full items-center gap-3.5 rounded-[18px] p-3 text-left transition-all',
                            'bg-zinc-50/90 active:scale-[0.99] dark:bg-white/[0.04]',
                            'hover:bg-zinc-100/90 dark:hover:bg-white/[0.07]'
                          )}
                        >
                          <span className="relative size-14 shrink-0 overflow-hidden rounded-2xl bg-zinc-200 ring-2 ring-white/80 dark:bg-zinc-800 dark:ring-zinc-900/80">
                            <ClientPhotoAvatar
                              name={client.clientName}
                              src={client.avatarUrl}
                              className="size-full"
                              textClassName="text-base font-semibold uppercase text-zinc-600 dark:text-zinc-300"
                              imgClassName="rounded-2xl object-cover"
                            />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                              {client.clientName}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                              {client.service}
                            </p>
                            <p className="mt-1 text-[11px] font-medium capitalize text-zinc-400 dark:text-zinc-500">
                              {client.dateLabel} · {client.time}
                            </p>
                          </div>
                          <span className={cn(bentoBadge, chip.className, 'shrink-0')}>
                            {chip.label}
                          </span>
                        </button>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <div className="rounded-[20px] px-3 py-6 text-center dark:bg-white/[0.03]">
                <PenLine
                  className="mx-auto mb-2 size-7 text-zinc-400 dark:text-zinc-500"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Journée plus légère
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Planifie un RDV ou ajoute un client ci-dessous.
                </p>
              </div>
            )}

            <div className={bentoListBlock}>
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                  <Users className="size-3.5" aria-hidden />
                  Clients
                </p>
                {onNewClient ? (
                  <button
                    type="button"
                    onClick={onNewClient}
                    className="text-[11px] font-semibold text-zinc-600 underline-offset-2 hover:underline active:scale-[0.98] dark:text-zinc-300"
                  >
                    Tout voir
                  </button>
                ) : null}
              </div>

              {onNewClient ? (
                <button
                  type="button"
                  onClick={onNewClient}
                  className={cn(
                    bentoListItem,
                    'mb-2 w-full cursor-pointer rounded-[16px] border border-dashed border-zinc-200/90 bg-zinc-50/80 dark:border-zinc-700/80 dark:bg-white/[0.03]'
                  )}
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/90">
                    <UserPlus className="size-4 text-zinc-600 dark:text-zinc-300" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    Nouveau client
                  </span>
                </button>
              ) : null}

              {hasClients ? (
                <ul className={bentoListDivided}>
                  {quickClients.slice(0, 6).map((client, i) => (
                    <motion.li
                      key={client.id}
                      {...(reduceMotion
                        ? {}
                        : {
                            initial: { opacity: 0 },
                            animate: { opacity: 1 },
                            transition: { delay: 0.04 + i * 0.03 },
                          })}
                    >
                      <button
                        type="button"
                        onClick={() => onNewAppointment()}
                        className={cn(
                          bentoListItem,
                          'w-full cursor-pointer text-left transition-colors hover:bg-zinc-50/80 active:scale-[0.99] dark:hover:bg-white/[0.04]'
                        )}
                      >
                        <BentoAvatar name={client.name} src={client.avatarUrl} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                            {client.name}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Planifier un RDV
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          Fiche →
                        </span>
                      </button>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="px-1 py-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  Aucun client pour l’instant — commence par « Nouveau client ».
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {!onOpenAgenda ? (
                <button
                  type="button"
                  onClick={onNewAppointment}
                  className={cn(microHover, bentoActionBtn, 'flex-1')}
                >
                  Nouveau RDV
                </button>
              ) : null}
              <button
                type="button"
                onClick={onOpenFlashTab}
                className={cn(
                  microHover,
                  'min-h-11 flex-1 rounded-[20px] border-0 bg-white px-4 py-2 text-sm font-medium text-zinc-800 dark:bg-white/[0.05] dark:text-white'
                )}
              >
                Flashs vitrine
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}
