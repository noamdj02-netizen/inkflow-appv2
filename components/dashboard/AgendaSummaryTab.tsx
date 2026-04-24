import React, { useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Clock, ListOrdered } from 'lucide-react';
import { Appointment } from '../../types';
import { cn } from '@/lib/utils';

type SummaryRange = 'day' | 'week' | 'month';

const STATUS_FR: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  completed: 'Terminé',
  cancelled: 'Annulé',
  in_progress: 'En cours',
  no_show: 'Absent',
};

function parseYmd(ymd: string): Date {
  return parse(ymd, 'yyyy-MM-dd', new Date());
}

function ymd(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export interface AgendaSummaryTabProps {
  appointments: Appointment[];
  today: string;
  onSelectAppointment: (apt: Appointment) => void;
  onOpenFullPlanning: () => void;
  onNewAppointment: () => void;
}

/**
 * Vue synthèse des RDV (jour / semaine / mois) — accès rapide sans fouiller le planning complet.
 */
export function AgendaSummaryTab({
  appointments,
  today,
  onSelectAppointment,
  onOpenFullPlanning,
  onNewAppointment,
}: AgendaSummaryTabProps) {
  const [range, setRange] = useState<SummaryRange>('week');
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));

  const { startStr, endStr, periodLabel, dayHeaders } = useMemo(() => {
    if (range === 'day') {
      const d = anchor;
      const s = ymd(d);
      return {
        startStr: s,
        endStr: s,
        periodLabel: format(d, 'EEEE d MMMM yyyy', { locale: fr }),
        dayHeaders: [s],
      };
    }
    if (range === 'week') {
      const ws = startOfWeek(anchor, { weekStartsOn: 1 });
      const we = endOfWeek(anchor, { weekStartsOn: 1 });
      const s = ymd(ws);
      const e = ymd(we);
      return {
        startStr: s,
        endStr: e,
        periodLabel: `${format(ws, 'd MMM', { locale: fr })} – ${format(we, 'd MMMM yyyy', { locale: fr })}`,
        dayHeaders: eachDayOfInterval({ start: ws, end: we }).map(ymd),
      };
    }
    const sm = startOfMonth(anchor);
    const em = endOfMonth(anchor);
    const s = ymd(sm);
    const e = ymd(em);
    return {
      startStr: s,
      endStr: e,
      periodLabel: format(sm, 'MMMM yyyy', { locale: fr }),
      dayHeaders: eachDayOfInterval({ start: sm, end: em }).map(ymd),
    };
  }, [range, anchor]);

  const inPeriod = useMemo(() => {
    return appointments
      .filter((a) => a.date >= startStr && a.date <= endStr)
      .sort((a, b) => {
        const c = a.date.localeCompare(b.date);
        if (c !== 0) return c;
        return a.time.localeCompare(b.time);
      });
  }, [appointments, startStr, endStr]);

  const byDay = useMemo(() => {
    const m = new Map<string, Appointment[]>();
    for (const a of inPeriod) {
      const list = m.get(a.date) ?? [];
      list.push(a);
      m.set(a.date, list);
    }
    return m;
  }, [inPeriod]);

  const activeCount = inPeriod.filter((a) => a.status !== 'cancelled').length;
  const cancelledInPeriod = inPeriod.filter((a) => a.status === 'cancelled').length;

  const goPrev = () => {
    if (range === 'day') setAnchor((d) => subDays(d, 1));
    else if (range === 'week') setAnchor((d) => subWeeks(d, 1));
    else setAnchor((d) => subMonths(d, 1));
  };

  const goNext = () => {
    if (range === 'day') setAnchor((d) => addDays(d, 1));
    else if (range === 'week') setAnchor((d) => addWeeks(d, 1));
    else setAnchor((d) => addMonths(d, 1));
  };

  const goToday = () => {
    setAnchor(startOfDay(new Date()));
  };

  return (
    <div className="min-w-0 max-w-3xl mx-auto pb-6">
      <div
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        role="region"
        aria-label="Période et vue"
      >
        <div
          className="flex gap-1 rounded-full bg-zinc-200/70 p-1 dark:bg-zinc-800/90"
          role="group"
          aria-label="Période"
        >
          {(
            [
              { id: 'day' as const, label: 'Jour' },
              { id: 'week' as const, label: 'Semaine' },
              { id: 'month' as const, label: 'Mois' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRange(opt.id)}
              className={cn(
                'flex flex-1 min-h-[40px] items-center justify-center rounded-full px-3 py-2 text-center text-[13px] font-medium transition-colors active:scale-[0.98] sm:flex-initial sm:px-4',
                range === opt.id
                  ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500'
                  : 'text-zinc-600 dark:text-zinc-400'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200/90 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              aria-label="Période précédente"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200/90 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              aria-label="Période suivante"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          </div>
          <button
            type="button"
            onClick={goToday}
            className="shrink-0 rounded-xl border border-zinc-200/90 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Aujourd’hui
          </button>
        </div>
      </div>

      <p className="mt-4 text-center text-sm font-medium text-zinc-700 dark:text-zinc-200 capitalize sm:text-left">
        {periodLabel}
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 sm:justify-start">
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100/90 px-2.5 py-1 dark:bg-zinc-800/80">
          <ListOrdered className="h-3.5 w-3.5" aria-hidden />
          {activeCount} rendez-vous sur la période
        </span>
        {cancelledInPeriod > 0 && (
          <span className="text-zinc-400 dark:text-zinc-500">
            dont {cancelledInPeriod} annulé(s)
          </span>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {inPeriod.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200/90 bg-zinc-50/80 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <Calendar
              className="h-10 w-10 text-zinc-300 dark:text-zinc-600"
              strokeWidth={1.5}
              aria-hidden
            />
            <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Aucun rendez-vous sur cette période
            </p>
            <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
              Passez en semaine ou en mois, ou ouvrez le planning complet pour ajouter un créneau.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={onNewAppointment}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.99] dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                Nouveau RDV
              </button>
              <button
                type="button"
                onClick={onOpenFullPlanning}
                className="rounded-xl border border-zinc-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Planning complet
              </button>
            </div>
          </div>
        ) : (
          dayHeaders.map((dateStr) => {
            const list = byDay.get(dateStr);
            if (!list || list.length === 0) {
              if (range === 'month' || range === 'week') {
                return null;
              }
              return null;
            }
            const isTodayHeader = dateStr === today;
            return (
              <div key={dateStr}>
                <div
                  className={cn(
                    'mb-2 flex items-center justify-between border-b border-zinc-200/80 pb-1.5 dark:border-zinc-800',
                    isTodayHeader && 'border-blue-200/80 dark:border-blue-500/30'
                  )}
                >
                  <p
                    className={cn(
                      'text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400',
                      isTodayHeader && 'text-blue-600 dark:text-blue-400'
                    )}
                  >
                    {format(parseYmd(dateStr), 'EEEE d MMMM', { locale: fr })}
                    {isTodayHeader && ' · aujourd’hui'}
                  </p>
                </div>
                <ul className="space-y-2">
                  {list.map((apt) => {
                    const cancelled = apt.status === 'cancelled';
                    return (
                      <li key={apt.id}>
                        <button
                          type="button"
                          onClick={() => onSelectAppointment(apt)}
                          className={cn(
                            'flex w-full min-h-[56px] items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white px-3 py-2.5 text-left shadow-sm transition-[transform,box-shadow] hover:border-zinc-300 hover:shadow-md active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-600',
                            cancelled && 'opacity-60'
                          )}
                        >
                          <span className="flex h-10 min-w-[3.5rem] flex-col items-center justify-center rounded-xl bg-zinc-100/90 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                            <Clock
                              className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400"
                              strokeWidth={2}
                              aria-hidden
                            />
                            <span className="text-[13px] font-semibold tabular-nums">
                              {apt.time || '—'}
                            </span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] font-semibold text-zinc-900 dark:text-white">
                              {apt.clientName}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                              {apt.service}
                            </span>
                          </span>
                          <span
                            className={cn(
                              'shrink-0 rounded-lg border px-2 py-1 text-[11px] font-semibold',
                              cancelled
                                ? 'border-zinc-200/80 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                                : 'border-blue-200/80 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200'
                            )}
                          >
                            {STATUS_FR[apt.status] ?? apt.status}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}

        {inPeriod.length > 0 && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenFullPlanning}
              className="w-full min-h-[48px] rounded-2xl border border-zinc-200/90 bg-zinc-50/90 px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:bg-zinc-100/90 active:scale-[0.99] dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Ouvrir le planning complet (semaine / mois, recherche, calendrier)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
