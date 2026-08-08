import { getClientAvatarForAppointment } from '@/lib/appointmentClientDisplay';
import type { Appointment, Client, ProjectRequest } from '@/types';
import type { DayClientPreview, ProjectInboxRow, StripeDepositRow, TodaySlot } from './types';

function depositRowStatus(depositPaid: boolean | undefined): StripeDepositRow['status'] {
  return depositPaid ? 'réussi' : 'en_cours';
}

const EXCLUDED_APT = new Set<Appointment['status']>(['cancelled', 'no_show']);

/** Même règles que `PlanningSidebar` / mini-calendrier agenda. */
export function countAgendaAppointmentsForDay(apps: Appointment[], dateYmd: string): number {
  return apps.filter((a) => a.date === dateYmd && !EXCLUDED_APT.has(a.status)).length;
}

export function countAgendaAppointmentsForMonth(apps: Appointment[], ref: Date): number {
  const y = ref.getFullYear();
  const m = String(ref.getMonth() + 1).padStart(2, '0');
  const prefix = `${y}-${m}`;
  return apps.filter((a) => a.date.startsWith(prefix) && !EXCLUDED_APT.has(a.status)).length;
}

function combineLocalDateAndTime(dateStr: string, timeStr: string): Date {
  const t = (timeStr || '09:00').trim();
  const [hRaw, mRaw] = t.split(':');
  const h = Math.min(23, Math.max(0, parseInt(hRaw || '9', 10) || 9));
  const m = Math.min(59, Math.max(0, parseInt(mRaw || '0', 10) || 0));
  const local = new Date(
    `${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
  );
  return local;
}

function mapAppointmentStatus(raw: Appointment['status']): TodaySlot['status'] {
  switch (raw) {
    case 'confirmed':
    case 'in_progress':
    case 'completed':
      return 'confirmé';
    case 'pending':
      return 'provisoire';
    default:
      return 'en_attente';
  }
}

function projectUrgency(slotExpiresAt: string | null | undefined): ProjectInboxRow['urgency'] {
  if (!slotExpiresAt) return 'normal';
  const exp = new Date(slotExpiresAt).getTime();
  if (Number.isNaN(exp)) return 'normal';
  if (exp < Date.now() + 48 * 3600000) return 'haut';
  return 'normal';
}

/** `todayAppointments` est déjà filtré sur la date du jour par `DashboardPro`. */
export function mapTodayAppointmentsToSlots(
  apps: Appointment[],
  clients: readonly Client[] = []
): TodaySlot[] {
  const slots = apps
    .filter((a) => !EXCLUDED_APT.has(a.status))
    .map((row) => {
      const start = combineLocalDateAndTime(row.date, row.time);
      const durMin = row.duration != null && row.duration > 0 ? row.duration : 60;
      const end = new Date(start.getTime() + durMin * 60000);
      return {
        id: row.id,
        start: start.toISOString(),
        end: end.toISOString(),
        title: row.service?.trim() || 'Séance',
        clientName: row.clientName?.trim() || 'Client',
        avatarUrl: getClientAvatarForAppointment(row, clients),
        status: mapAppointmentStatus(row.status),
      };
    });
  return slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

function formatShortDayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function appointmentToDayPreview(row: Appointment, clients: readonly Client[]): DayClientPreview {
  return {
    appointmentId: row.id,
    clientId: row.clientId,
    clientName: row.clientName?.trim() || 'Client',
    avatarUrl: getClientAvatarForAppointment(row, clients),
    service: row.service?.trim() || 'Séance',
    date: row.date,
    dateLabel: formatShortDayLabel(row.date),
    time: (row.time || '09:00').slice(0, 5),
    status: mapAppointmentStatus(row.status),
  };
}

function sortAppointmentsBySchedule(a: Appointment, b: Appointment): number {
  const byDate = a.date.localeCompare(b.date);
  return byDate !== 0 ? byDate : (a.time || '').localeCompare(b.time || '');
}

/**
 * Journée vide : montre 2–3 clients des jours 2 et 3 du mois courant (ex. 2 & 3 mai),
 * sinon les prochains RDV après aujourd’hui.
 */
export function mapPlanningDayPreviewClients(
  apps: Appointment[],
  clients: readonly Client[],
  todayYmd: string,
  highlightMonthDays: number[] = [2, 3],
  limit = 3
): DayClientPreview[] {
  const monthPrefix = todayYmd.slice(0, 7);
  const highlightDates = new Set(
    highlightMonthDays.map((d) => `${monthPrefix}-${String(d).padStart(2, '0')}`)
  );

  const fromHighlight = apps
    .filter((a) => highlightDates.has(a.date) && !EXCLUDED_APT.has(a.status))
    .sort(sortAppointmentsBySchedule)
    .slice(0, limit)
    .map((row) => appointmentToDayPreview(row, clients));

  if (fromHighlight.length >= limit) return fromHighlight;

  const upcoming = apps
    .filter((a) => a.date > todayYmd && !EXCLUDED_APT.has(a.status))
    .sort(sortAppointmentsBySchedule)
    .slice(0, limit - fromHighlight.length)
    .map((row) => appointmentToDayPreview(row, clients));

  return [...fromHighlight, ...upcoming];
}

/** Aligné sur `mapTodayAppointmentsToSlots` (hors cancelled / no_show). */
export function countActiveTodayAppointmentSlots(
  apps: Appointment[],
  clients: readonly Client[] = [],
  dateYmd?: string
): number {
  if (dateYmd) return countAgendaAppointmentsForDay(apps, dateYmd);
  return mapTodayAppointmentsToSlots(apps, clients).length;
}

/**
 * `recentDeposits` : rendez-vous avec acompte encaissé (déjà triés / limités côté parent).
 */
export function mapAppointmentDepositsToStripeRows(deposits: Appointment[]): StripeDepositRow[] {
  return deposits
    .map((row) => ({
      id: row.id,
      amountCents: Math.round((row.deposit ?? 0) * 100),
      currency: 'eur',
      clientLabel: row.clientName?.trim() || 'Client',
      receivedAt: row.updatedAt || row.createdAt,
      status: depositRowStatus(row.depositPaid),
    }))
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
}

export function mapProjectRequestsToInbox(
  requests: ProjectRequest[],
  limit = 5
): ProjectInboxRow[] {
  return [...requests]
    .filter((p) => p.status === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
    .map((p) => ({
      id: p.id,
      clientName: p.clientName?.trim() || 'Client',
      motif: p.description?.trim() || 'Projet personnalisé',
      createdAt: p.createdAt,
      urgency: projectUrgency(p.slotExpiresAt),
    }));
}
