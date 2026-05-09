/**
 * Inspiré calendrier mois plein écran (patterns shadcn / date-fns / lucide — ex. communauté 21st).
 */
import * as React from 'react';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, PlusCircle, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export interface CalendarEventItem {
  id: string;
  name: string;
  time: string;
  datetime: string;
}

export interface CalendarDayData {
  day: Date;
  events: CalendarEventItem[];
}

/** Colonne Tailwind selon iso-week commençant lundi pour le tout premier jour de la grille. */
const COL_START_MONDAY_FIRST = [
  '',
  'col-start-1',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
  'col-start-7',
];

function weekdayIndexMondayFirst(day: Date): number {
  return (day.getDay() + 6) % 7;
}

/** Jours d’entête Lun → Dim — alignés sur le reste du dashboard FR. */
const WEEKDAY_HEADERS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function parseLocalYmdToDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
}

export interface FullScreenCalendarProps {
  /** Jours avec événements (ex. groupement par date de RDV). */
  data: CalendarDayData[];
  /** `YYYY-MM-DD` ou aucune sélection. */
  selectedDateYmd: string | null;
  onSelectDay: (ymd: string) => void;
  /** Repère quel mois est affiché (n’importe quel jour du mois). */
  monthDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  /** Par défaut : mois « aujourd’hui » + jour sélectionné aujourd’hui. */
  onGoToday?: () => void;
  onNewEvent?: () => void;
  /** Ouvre la recherche parente (liste). */
  onSearchClick?: () => void;
  className?: string;
}

export function FullScreenCalendar({
  data,
  selectedDateYmd,
  onSelectDay,
  monthDate,
  onPrevMonth,
  onNextMonth,
  onGoToday,
  onNewEvent,
  onSearchClick,
  className,
}: FullScreenCalendarProps) {
  const today = startOfToday();
  const selectedDay =
    selectedDateYmd !== null &&
    typeof selectedDateYmd === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(selectedDateYmd)
      ? parseLocalYmdToDate(selectedDateYmd.trim())
      : null;

  const firstDayCurrentMonth = startOfMonth(monthDate);

  const days = React.useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(firstDayCurrentMonth, { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(firstDayCurrentMonth), { weekStartsOn: 1 }),
      }),
    [firstDayCurrentMonth]
  );

  function goToTodayUi() {
    if (onGoToday) {
      onGoToday();
      return;
    }
    const ymd = format(today, 'yyyy-MM-dd');
    onSelectDay(ymd);
  }

  function ymd(day: Date) {
    return format(day, 'yyyy-MM-dd');
  }

  return (
    <div className={cn('flex flex-1 flex-col', className)}>
      <div className="flex flex-col space-y-4 p-3 sm:p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none">
        <div className="flex flex-auto">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden w-16 flex-shrink-0 flex-col items-center justify-center rounded-xl border bg-muted py-1 sm:w-20 md:flex">
              <span className="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {format(today, 'MMM', { locale: fr })}
              </span>
              <div className="mt-1 flex w-full items-center justify-center rounded-lg border bg-background px-0.5 py-1 font-display text-lg font-bold">
                <span>{format(today, 'd')}</span>
              </div>
            </div>
            <div className="min-w-0 flex flex-col">
              <h2 className="truncate font-display text-base font-semibold text-foreground sm:text-lg">
                {format(firstDayCurrentMonth, 'MMMM yyyy', { locale: fr })}
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {format(firstDayCurrentMonth, 'd MMM', { locale: fr })} →{' '}
                {format(endOfMonth(firstDayCurrentMonth), 'd MMM yyyy', {
                  locale: fr,
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-4 lg:gap-6">
          {onSearchClick && (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="hidden lg:flex shrink-0"
                onClick={onSearchClick}
                aria-label="Rechercher un rendez-vous"
              >
                <Search className="size-4 shrink-0" strokeWidth={2} aria-hidden />
              </Button>
              <Separator orientation="vertical" className="hidden h-6 lg:block" />
            </>
          )}

          <div className="inline-flex w-full rounded-xl border border-transparent shadow-black/5 shadow-sm md:w-auto">
            <Button
              type="button"
              onClick={onPrevMonth}
              className="rounded-none rounded-s-xl shadow-none first:rounded-s-xl last:rounded-e-xl focus-visible:z-10"
              variant="outline"
              size="icon"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            </Button>
            <Button
              type="button"
              onClick={goToTodayUi}
              className="grow rounded-none shadow-none px-4 focus-visible:z-10 md:grow-0"
              variant="outline"
            >
              Aujourd’hui
            </Button>
            <Button
              type="button"
              onClick={onNextMonth}
              className="rounded-none rounded-e-xl shadow-none focus-visible:z-10"
              variant="outline"
              size="icon"
              aria-label="Mois suivant"
            >
              <ChevronRight className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            </Button>
          </div>

          <Separator orientation="vertical" className="hidden h-6 md:block" />
          <Separator orientation="horizontal" className="block w-full md:hidden" />

          {onNewEvent && (
            <Button
              type="button"
              className="h-11 w-full gap-2 md:h-9 md:w-auto active:scale-[0.98] transition-all"
              onClick={onNewEvent}
            >
              <PlusCircle className="size-4 shrink-0" strokeWidth={2} aria-hidden />
              <span>Nouveau RDV</span>
            </Button>
          )}
        </div>
      </div>

      <div className="lg:flex lg:flex-auto lg:flex-col">
        <div className="grid grid-cols-7 border border-b-0 text-center text-[10px] font-semibold leading-none text-muted-foreground sm:text-xs lg:flex-none">
          {WEEKDAY_HEADERS.map((wd) => (
            <div key={wd} className="border-border border-e border-b px-1 py-2 last:border-e-0">
              {wd}
            </div>
          ))}
        </div>

        <div className="flex text-[10px] leading-tight text-foreground sm:text-xs lg:flex-auto">
          <div className="hidden w-full border-x border-border lg:grid lg:grid-cols-7 lg:auto-rows-fr">
            {days.map((day, dayIdx) => {
              const dotCount = data
                .filter((d) => isSameDay(d.day, day))
                .reduce((acc, bundle) => acc + bundle.events.length, 0);
              const bundles = data.filter((d) => isSameDay(d.day, day));

              const isSelected = selectedDay != null && isEqual(day, selectedDay);
              const inMonth = isSameMonth(day, firstDayCurrentMonth);

              const dayButton = (
                <button
                  type="button"
                  onClick={() => onSelectDay(ymd(day))}
                  aria-pressed={isSelected}
                  className={cn(
                    isSelected && !isToday(day) && 'bg-primary text-primary-foreground',
                    isSelected && isToday(day) && 'bg-primary text-primary-foreground',
                    !isSelected && !isToday(day) && inMonth && 'border-transparent text-foreground',
                    !isSelected &&
                      !isToday(day) &&
                      !inMonth &&
                      'bg-accent/50 text-muted-foreground',
                    !isSelected && !inMonth && !isToday(day) && 'hover:bg-accent/70',
                    (isSelected || isToday(day)) && 'font-semibold',
                    'relative flex size-8 items-center justify-center rounded-full border text-xs hover:border-neutral-600/35 dark:hover:border-neutral-400/35'
                  )}
                >
                  <time dateTime={ymd(day)}>{format(day, 'd')}</time>
                </button>
              );

              const cellBg = cn(
                !isSelected && !isToday(day) && !inMonth && 'bg-accent/40 text-muted-foreground',
                !isSelected && !isToday(day) && inMonth && 'hover:bg-accent/55',
                !isSelected && 'hover:bg-muted/75 dark:hover:bg-muted/40'
              );

              const colStartOnly =
                dayIdx === 0 && COL_START_MONDAY_FIRST[weekdayIndexMondayFirst(day) + 1];

              return (
                <div
                  key={ymd(day) + '-lg'}
                  className={cn(
                    colStartOnly,
                    'relative flex min-h-[5.25rem] flex-col border-e border-border border-b',
                    cellBg,
                    dotCount === 0 && 'min-h-[3.75rem]'
                  )}
                >
                  <header className="flex justify-end px-2 pt-2">{dayButton}</header>
                  <div className="min-h-0 flex-1 px-2 pb-2">
                    {bundles.flatMap((b) =>
                      b.events.slice(0, 1).map((event) => (
                        <div key={event.id} className="space-y-1 rounded-xl border bg-muted/50 p-2">
                          <p className="line-clamp-2 font-medium leading-snug">{event.name}</p>
                          {event.time && (
                            <p className="text-[10px] text-muted-foreground">{event.time}</p>
                          )}
                        </div>
                      ))
                    )}
                    {dotCount > 1 && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        + {dotCount - 1} {dotCount - 1 === 1 ? 'autre' : 'autres'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="isolate grid w-full auto-rows-fr grid-cols-7 border-x lg:hidden">
            {days.map((day) => {
              const bundles = data.filter((d) => isSameDay(d.day, day));
              const total = bundles.reduce((a, b) => a + b.events.length, 0);
              const isSelected = selectedDay != null && isEqual(day, selectedDay);
              const inMonth = isSameMonth(day, firstDayCurrentMonth);

              return (
                <button
                  key={ymd(day) + '-sm'}
                  type="button"
                  onClick={() => onSelectDay(ymd(day))}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex min-h-14 touch-manipulation flex-col border-border border-e border-b px-2 py-2 text-start last:border-e active:scale-[0.98] transition-all motion-reduce:active:scale-100',
                    isSelected && 'bg-primary/10 ring-2 ring-primary/20',
                    !isSelected && 'hover:bg-muted',
                    !isSelected && !inMonth && !isToday(day) && 'text-muted-foreground',
                    !isSelected && (inMonth || isToday(day)) && 'text-foreground',
                    !isSelected && isToday(day) && 'font-semibold'
                  )}
                >
                  <time
                    dateTime={ymd(day)}
                    className={cn(
                      'mb-1 ms-auto flex size-6 shrink-0 items-center justify-center rounded-full',
                      isSelected && !isToday(day) && 'bg-primary text-primary-foreground',
                      isSelected && isToday(day) && 'bg-primary text-primary-foreground',
                      !isSelected && isToday(day) && 'border border-primary/70 font-semibold'
                    )}
                  >
                    {format(day, 'd')}
                  </time>
                  {total > 0 ? (
                    <div className="mt-auto flex flex-wrap-reverse justify-end gap-x-1">
                      {bundles.flatMap((b) =>
                        b.events.map((ev) => (
                          <span
                            key={`${ev.id}-dot`}
                            className="mb-1 inline-block size-1.5 rounded-full bg-primary/70"
                          />
                        ))
                      )}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
