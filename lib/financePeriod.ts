export type FinancePeriod = 'today' | 'week' | 'month';

const MONTH_LABELS = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Jun',
  'Jul',
  'Août',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];

function toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Plage calendaire locale + libellé FR pour sélecteur finance. */
export function getFinancePeriodRange(period: FinancePeriod): {
  start: string;
  end: string;
  label: string;
  startIso: string;
  endIso: string;
} {
  const now = new Date();
  if (period === 'today') {
    const today = toIsoDate(now);
    return {
      start: today,
      end: today,
      startIso: `${today}T00:00:00.000Z`,
      endIso: `${today}T23:59:59.999Z`,
      label: now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    };
  }
  if (period === 'week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return {
      start: toIsoDate(start),
      end: toIsoDate(end),
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      label: `Semaine du ${start.getDate()} au ${end.getDate()} ${MONTH_LABELS[end.getMonth()]}`,
    };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return {
    start: toIsoDate(start),
    end: toIsoDate(end),
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    label: now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
  };
}
