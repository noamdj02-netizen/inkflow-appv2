import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgendaSummaryTabProps } from '../AgendaSummaryTab';
import { DashboardLoadingSkeleton } from '../../common/LoadingSkeleton';

const LazyAgendaSummaryTab = lazy(() =>
  import('../AgendaSummaryTab').then((m) => ({ default: m.AgendaSummaryTab }))
);

const STORAGE_KEY = 'inkflow-overview-agenda-expanded';

export type OverviewAgendaSummarySectionProps = AgendaSummaryTabProps & {
  /** Incrémenté par le parent pour ouvrir + scroller (deep link `?tab=agenda`). */
  expandSignal?: number;
};

export function OverviewAgendaSummarySection({
  expandSignal = 0,
  ...agendaProps
}: OverviewAgendaSummarySectionProps) {
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(STORAGE_KEY) !== '0';
  });

  useEffect(() => {
    if (expandSignal > 0) setOpen(true);
  }, [expandSignal]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, open ? '1' : '0');
    } catch {
      //
    }
  }, [open]);

  return (
    <section
      id="overview-agenda-synthesis"
      aria-label="Synthèse agenda"
      className="scroll-mt-24 rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800/90 dark:bg-zinc-900/50"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="overview-agenda-synthesis-panel"
        className="flex w-full min-h-[52px] items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-zinc-50/80 active:scale-[0.99] dark:hover:bg-zinc-800/40 sm:px-5"
      >
        <span className="inline-flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            <Calendar className="size-4 shrink-0 stroke-[1.75]" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="type-heading-sm block">Synthèse agenda</span>
            <span className="type-caption text-muted-foreground">
              Jour, semaine ou mois — sans ouvrir le planning complet
            </span>
          </span>
        </span>
        <ChevronDown
          className={cn(
            'size-5 shrink-0 text-zinc-400 transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id="overview-agenda-synthesis-panel"
          className="border-t border-zinc-200/80 px-3 pb-4 pt-2 dark:border-zinc-800/90 sm:px-4 sm:pb-5"
        >
          <Suspense fallback={<DashboardLoadingSkeleton />}>
            <LazyAgendaSummaryTab {...agendaProps} />
          </Suspense>
        </div>
      ) : null}
    </section>
  );
}
