import type { Appointment } from '../types';

/** Minutes depuis minuit (00:00) pour une chaîne `HH:mm` ou `H:mm`. */
export function parseTimeToMinutes(t: string): number {
  const parts = t.split(':');
  const hh = parseInt(parts[0] ?? '0', 10);
  const mm = parseInt(parts[1] ?? '0', 10);
  if (Number.isNaN(hh)) return 0;
  return hh * 60 + (Number.isNaN(mm) ? 0 : mm);
}

/** Même logique qu’historiquement dans `AppointmentCalendar` (affichage intra-journée). */
export function formatHm(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const DEFAULT_DURATION_MIN = 60;

/**
 * Plage d’affichage : `apt.time` + fin = début + `duration` (min).
 * Si `duration` absente, 60 min par défaut.
 */
export function formatTimeRange(apt: Appointment): string {
  const startM = parseTimeToMinutes(apt.time || '09:00');
  const duration =
    typeof apt.duration === 'number' && !Number.isNaN(apt.duration) && apt.duration > 0
      ? apt.duration
      : DEFAULT_DURATION_MIN;
  const endM = startM + duration;
  return `${formatHm(startM)} – ${formatHm(endM)}`;
}
