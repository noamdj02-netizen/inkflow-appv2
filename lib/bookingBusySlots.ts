import type { Appointment } from '../types';

/** Normalise une heure RDV en `HH:mm` (aligné vitrine / get-studio-availability). */
export function normalizeSlotTime(t: string | null | undefined): string {
  if (!t) return '';
  const s = String(t).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return s;
  const h = m[1].padStart(2, '0');
  return `${h}:${m[2]}`;
}

const ACTIVE_STATUSES: Appointment['status'][] = ['pending', 'confirmed', 'in_progress'];

/**
 * Construit la carte date → heures occupées à partir des RDV locaux (dashboard),
 * pour aligner la saisie manuelle sur le même modèle que la réservation vitrine.
 */
export function appointmentsToBusySlots(appointments: Appointment[]): Record<string, string[]> {
  const acc: Record<string, Set<string>> = {};
  for (const a of appointments) {
    if (!ACTIVE_STATUSES.includes(a.status)) continue;
    const d = (a.date || '').split('T')[0];
    if (!d) continue;
    const tm = normalizeSlotTime(a.time);
    if (!tm) continue;
    if (!acc[d]) acc[d] = new Set();
    acc[d].add(tm);
  }
  return Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, [...v]]));
}

export function mergeBusySlots(
  server: Record<string, string[]>,
  local: Record<string, string[]>
): Record<string, string[]> {
  const out: Record<string, Set<string>> = {};
  const add = (date: string, times: string[]) => {
    if (!out[date]) out[date] = new Set();
    times.forEach((t) => {
      const n = normalizeSlotTime(t);
      if (n) out[date].add(n);
    });
  };
  for (const [d, arr] of Object.entries(server)) add(d, arr || []);
  for (const [d, arr] of Object.entries(local)) add(d, arr || []);
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v]]));
}
