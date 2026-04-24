/**
 * Dates agenda / planning — semaine lundi→dimanche (FR / ISO 8601),
 * chaînes jour en **locale** YYYY-MM-DD (ne pas utiliser toISOString().slice(0, 10) pour un jour civil).
 */
import { addDays, addWeeks, endOfWeek, format, parse, startOfDay, startOfWeek } from 'date-fns';

/** Lundi = 1 (aligné date-fns `weekStartsOn`) */
export const AGENDA_WEEK_STARTS_ON = 1 as const;

export function toLocalYmd(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function parseLocalYmd(ymd: string): Date {
  return parse(ymd, 'yyyy-MM-dd', new Date());
}

export function agendaWeekStart(d: Date): Date {
  return startOfWeek(d, { weekStartsOn: AGENDA_WEEK_STARTS_ON });
}

export function agendaWeekEnd(d: Date): Date {
  return endOfWeek(d, { weekStartsOn: AGENDA_WEEK_STARTS_ON });
}

/** Cellules vides avant le 1er du mois : colonne 0 = lundi. */
export function mondayOffsetFromMonthFirst(firstOfMonth: Date): number {
  return (firstOfMonth.getDay() + 6) % 7;
}

export function addAgendaNavStep(weekAnchor: Date, viewMode: 'day' | 'week', dir: -1 | 1): Date {
  if (viewMode === 'day') return startOfDay(addDays(weekAnchor, dir));
  return startOfDay(addWeeks(weekAnchor, dir));
}
