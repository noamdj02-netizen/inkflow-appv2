/**
 * Construit les timestamps ISO pour l’acceptation projet (Edge Function project-request-accept).
 * Créneau = date locale (Europe) + libellé slot (morning / afternoon / evening / HH:mm).
 * Expiration par défaut : +72 h après le début du créneau proposé.
 */
const SLOT_TO_HHMM: Record<string, string> = {
  morning: '10:00',
  afternoon: '14:00',
  evening: '18:00',
};

function slotToHHMM(slot: string): string {
  const s = String(slot).trim();
  if (/^\d{1,2}:\d{2}$/.test(s)) {
    const [h, m] = s.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  }
  const key = s.toLowerCase();
  if (key in SLOT_TO_HHMM) return SLOT_TO_HHMM[key];
  return '10:00';
}

export function buildProjectAcceptTimestamps(
  ymd: string,
  slot: string,
  expiresHoursAfter = 72,
): { proposed_slot: string; slot_expires_at: string } {
  const hhmm = slotToHHMM(slot);
  const [y, month, day] = ymd.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  const localStart = new Date(y, month - 1, day, hh, mm, 0, 0);
  const proposed_slot = localStart.toISOString();
  const slot_expires_at = new Date(localStart.getTime() + expiresHoursAfter * 60 * 60 * 1000).toISOString();
  return { proposed_slot, slot_expires_at };
}
