/**
 * Indique si le studio a enregistré un planning hebdo complet (Paramètres → Disponibilités).
 * L’onboarding ne persiste que { offDays, bookingWindowDays } — sans weeklySchedule, on considère que ce n’est pas finalisé.
 */
const WEEK_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export function isStudioAvailabilityConfigured(raw: unknown): boolean {
  if (raw == null || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  const ws = o.weeklySchedule;
  if (ws == null || typeof ws !== 'object') return false;
  const schedule = ws as Record<string, unknown>;
  for (const k of WEEK_DAYS) {
    const day = schedule[k];
    if (day != null && typeof day === 'object' && (day as { enabled?: boolean }).enabled === true) {
      return true;
    }
  }
  return false;
}
