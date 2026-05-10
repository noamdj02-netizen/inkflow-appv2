import type { Appointment, Booking, BookingStatus, ProjectRequest } from '../types';

/** Préfixe des RDV « virtuels » construits depuis une demande (page book / brief). */
export const CLIENT_PREVIEW_SYNTHETIC_ID_PREFIX = 'inkflow-preview:';

export function isSyntheticClientPreviewAppointmentId(id: string): boolean {
  return id.startsWith(CLIENT_PREVIEW_SYNTHETIC_ID_PREFIX);
}

/** Extrait l’identifiant de thread messagerie pour une demande /book (ex. id booking). */
export function messageThreadIdFromSyntheticPreviewAppointmentId(
  appointmentId: string
): string | null {
  const m = appointmentId.match(/^inkflow-preview:booking:(.+)$/);
  return m ? m[1] : null;
}

function bookingStatusToAppointmentStatus(s: BookingStatus): Appointment['status'] {
  switch (s) {
    case 'pending':
      return 'pending';
    case 'confirmed':
    case 'accepted':
      return 'confirmed';
    case 'rejected':
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}

function bookingTimeToSlot(t: string | null | undefined): string {
  if (!t) return '10:00';
  const s = String(t).toLowerCase();
  if (s === 'morning') return '10:00';
  if (s === 'afternoon') return '14:00';
  if (s === 'evening') return '18:00';
  if (/^\d{1,2}:\d{2}$/.test(t)) return t.length === 5 ? t : t;
  return '12:00';
}

export function syntheticAppointmentFromBooking(b: Booking): Appointment {
  const rawDate = b.requestedDate?.trim() ?? '';
  const date =
    rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ? rawDate
      : new Date(b.createdAt).toISOString().slice(0, 10);
  const desc = b.description?.trim() ?? '';
  const service =
    desc.length > 100 ? `${desc.slice(0, 97)}…` : desc.length > 0 ? desc : 'Demande page book';
  return {
    id: `${CLIENT_PREVIEW_SYNTHETIC_ID_PREFIX}booking:${b.id}`,
    clientId: '',
    clientName: b.clientName,
    clientEmail: b.clientEmail,
    clientPhone: b.clientPhone ?? '',
    date,
    time: bookingTimeToSlot(b.requestedTime),
    service,
    duration: 60,
    price: 0,
    deposit: 0,
    depositPaid: false,
    status: bookingStatusToAppointmentStatus(b.status),
    notes: b.description,
    tattooType: 'custom',
    location: 'other',
    size: 'medium',
    images: b.referenceImages?.filter(Boolean),
    consentFormSigned: false,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

function projectStatusToAppointmentStatus(s: ProjectRequest['status']): Appointment['status'] {
  if (s === 'rejected') return 'cancelled';
  if (s === 'accepted' || s === 'confirmed') return 'confirmed';
  return 'pending';
}

export function syntheticAppointmentFromProjectRequest(pr: ProjectRequest): Appointment {
  const desc = pr.description?.trim() ?? '';
  const service =
    desc.length > 100 ? `${desc.slice(0, 97)}…` : desc.length > 0 ? desc : 'Brief sans date';
  const d = new Date(pr.createdAt);
  const date = Number.isNaN(d.getTime())
    ? new Date().toISOString().slice(0, 10)
    : d.toISOString().slice(0, 10);
  const ig = pr.clientInstagram?.trim();
  const notes = [pr.description, ig ? `Instagram: @${ig}` : ''].filter(Boolean).join('\n');
  return {
    id: `${CLIENT_PREVIEW_SYNTHETIC_ID_PREFIX}project:${pr.id}`,
    clientId: '',
    clientName: pr.clientName,
    clientEmail: pr.clientEmail,
    clientPhone: '',
    date,
    time: '12:00',
    service,
    duration: 60,
    price: 0,
    deposit: 0,
    depositPaid: false,
    status: projectStatusToAppointmentStatus(pr.status),
    notes,
    tattooType: pr.projectType === 'flash' ? 'flash' : 'custom',
    location: 'other',
    size: 'medium',
    images: pr.referenceImages?.filter(Boolean),
    consentFormSigned: false,
    projectRequestId: pr.id,
    createdAt: pr.createdAt,
    updatedAt: pr.createdAt,
  };
}

/** Source pour ouvrir la fiche client riche depuis l’onglet Demandes. */
export type ClientFicheDemandeSource =
  | { kind: 'appointment'; appointment: Appointment }
  | { kind: 'booking'; booking: Booking }
  | { kind: 'project'; project: ProjectRequest };
