import type { Appointment, ProjectRequest } from '@/types';
import type { ProjectInboxRow, StripeDepositRow, TodaySlot } from './types';

function depositRowStatus(depositPaid: boolean | undefined): StripeDepositRow['status'] {
  return depositPaid ? 'réussi' : 'en_cours';
}

const EXCLUDED_APT = new Set<Appointment['status']>(['cancelled', 'no_show']);

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
export function mapTodayAppointmentsToSlots(apps: Appointment[]): TodaySlot[] {
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
        status: mapAppointmentStatus(row.status),
      };
    });
  return slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/** Aligné sur `mapTodayAppointmentsToSlots` (hors cancelled / no_show). */
export function countActiveTodayAppointmentSlots(apps: Appointment[]): number {
  return mapTodayAppointmentsToSlots(apps).length;
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
