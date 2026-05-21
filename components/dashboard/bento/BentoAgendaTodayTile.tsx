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
              {hasToday ? 'Planning du jour' : 'Planning & clients'}
            </h2>
            <p className="text-xs capitalize text-zinc-500 dark:text-zinc-400">
              {hasToday ? todayLabel : 'Remplis ta journée en un clic'}
            </p>
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
            {badgeCount > 0
              ? `${badgeCount} ${hasToday ? 'créneau' : 'client'}${badgeCount > 1 ? 's' : ''}`
              : 'Libre'}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-col max-md:overflow-visible md:min-h-0 md:flex-1 md:overflow-y-auto md:pr-1 [-webkit-overflow-scrolling:touch]">
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
              <button
                type="button"
                onClick={onNewAppointment}
                className={cn(microHover, bentoActionBtn, 'flex-1')}
              >
                Nouveau RDV
              </button>
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
