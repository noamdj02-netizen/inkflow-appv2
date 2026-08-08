import type { Appointment, Booking, ProjectRequest } from '@/types';
import { sortInboxBySla } from './inboxSlaSort';

export type InboxQuickTarget =
  | { source: 'booking'; item: Booking; clientName: string }
  | { source: 'agenda'; item: Appointment; clientName: string }
  | { source: 'project'; item: ProjectRequest; clientName: string };

/** Priorité file « À traiter » : vitrine book → agenda → brief. */
export function pickFirstPendingInboxItem(
  bookings: Booking[],
  appointments: Appointment[],
  projects: ProjectRequest[]
): InboxQuickTarget | null {
  const book = sortInboxBySla(bookings.filter((b) => b.status === 'pending'))[0];
  if (book) {
    return { source: 'booking', item: book, clientName: book.clientName };
  }
  const apt = sortInboxBySla(appointments.filter((a) => a.status === 'pending'))[0];
  if (apt) {
    return { source: 'agenda', item: apt, clientName: apt.clientName };
  }
  const pr = sortInboxBySla(projects.filter((p) => p.status === 'pending'))[0];
  if (pr) {
    return { source: 'project', item: pr, clientName: pr.clientName };
  }
  return null;
}

export function inboxPrimaryActionLabel(target: InboxQuickTarget): string {
  switch (target.source) {
    case 'booking':
      return 'Confirmer la réservation';
    case 'agenda':
      return 'Confirmer le créneau';
    case 'project':
      return 'Répondre au brief';
    default:
      return 'Traiter';
  }
}

export function inboxSourceChipLabel(target: InboxQuickTarget): string {
  switch (target.source) {
    case 'booking':
      return 'Page book';
    case 'agenda':
      return 'Agenda';
    case 'project':
      return 'Brief';
    default:
      return 'Demande';
  }
}
