import type { Appointment } from '../types';

function combineLocalDateAndTime(dateStr: string, timeStr: string): Date {
  const t = (timeStr || '09:00').trim();
  const [hRaw, mRaw] = t.split(':');
  const h = Math.min(23, Math.max(0, parseInt(hRaw || '9', 10) || 9));
  const m = Math.min(59, Math.max(0, parseInt(mRaw || '0', 10) || 0));
  return new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
}

/**
 * Si l’heure actuelle tombe dans le créneau du RDV (+ 30 min de grâce),
 * passe le statut en `in_progress` pour afficher « Clôturer / encaisser ».
 */
export function appointmentSyncedForCloseout(
  apt: Appointment,
  now: Date = new Date()
): Appointment {
  if (apt.status === 'cancelled' || apt.status === 'no_show' || apt.status === 'completed') {
    return apt;
  }
  const start = combineLocalDateAndTime(apt.date, apt.time);
  const startMs = start.getTime();
  if (Number.isNaN(startMs)) return apt;
  const durMin = apt.duration != null && apt.duration > 0 ? apt.duration : 60;
  const endMs = startMs + durMin * 60000 + 30 * 60000;
  const nowMs = now.getTime();
  if (nowMs >= startMs && nowMs <= endMs && apt.status === 'confirmed') {
    return { ...apt, status: 'in_progress' };
  }
  return apt;
}

export function formatAppointmentSlotLabel(apt: Appointment): string {
  const d = new Date(`${apt.date}T12:00:00`);
  const day = Number.isNaN(d.getTime())
    ? apt.date
    : d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = (apt.time || '09:00').slice(0, 5);
  return `${day} · ${time}`;
}
