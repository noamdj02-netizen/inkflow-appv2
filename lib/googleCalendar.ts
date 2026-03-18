import { supabase } from './supabase';

export interface GoogleCalendarEvent {
  googleId: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
}

export interface CalendarIntegrationStatus {
  connected: boolean;
  integration: {
    provider?: string;
    google_calendar_id?: string | null;
    last_synced_at?: string | null;
  } | null;
}

function toUserFriendlyMessage(fnName: string, raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('failed to send') || lower.includes('edge function') || lower.includes('fetch') || lower.includes('network')) {
    return `Google Agenda indisponible. Vérifiez votre connexion ou contactez le support.`;
  }
  return raw;
}

async function invokeEdge<T = unknown>(fnName: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fnName, { body });
  if (error) {
    const errData = typeof data === 'object' && data && 'error' in data ? (data as { error?: string }).error : null;
    const raw = errData || error.message || 'Edge function error';
    throw new Error(toUserFriendlyMessage(fnName, raw));
  }
  if (data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error) {
    const raw = (data as { error: string }).error;
    throw new Error(toUserFriendlyMessage(fnName, raw));
  }
  return data as T;
}

export async function getCalendarStatus(studioId: string): Promise<CalendarIntegrationStatus> {
  return invokeEdge('google-calendar-auth', { action: 'status', studioId });
}

export async function initiateGoogleAuth(studioId: string): Promise<string> {
  const res = await invokeEdge<{ authUrl: string }>('google-calendar-auth', {
    action: 'initiate',
    studioId,
  });
  return res.authUrl;
}

export async function completeGoogleAuth(code: string, studioId: string): Promise<boolean> {
  const res = await invokeEdge<{ success: boolean }>('google-calendar-auth', {
    action: 'callback',
    code,
    studioId,
  });
  return res.success;
}

export async function disconnectGoogle(studioId: string): Promise<void> {
  await invokeEdge('google-calendar-auth', { action: 'disconnect', studioId });
}

export async function pushAppointmentToGoogle(studioId: string, appointmentId: string): Promise<string | null> {
  const res = await invokeEdge<{ success: boolean; googleEventId?: string }>('google-calendar-sync', {
    action: 'push_one',
    studioId,
    appointmentId,
  });
  return res.googleEventId || null;
}

export async function pushAllAppointments(studioId: string): Promise<number> {
  const res = await invokeEdge<{ success: boolean; synced: number }>('google-calendar-sync', {
    action: 'push_all',
    studioId,
  });
  return res.synced;
}

export async function pullGoogleEvents(studioId: string): Promise<GoogleCalendarEvent[]> {
  const res = await invokeEdge<{ success: boolean; events: GoogleCalendarEvent[] }>('google-calendar-sync', {
    action: 'pull',
    studioId,
  });
  return res.events || [];
}

export async function deleteGoogleEvent(studioId: string, appointmentId: string): Promise<void> {
  await invokeEdge('google-calendar-sync', {
    action: 'delete',
    studioId,
    appointmentId,
  });
}

/** Generate an .ics file content for a single appointment (Apple Calendar / generic fallback) */
export function generateICS(apt: {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  location?: string;
  notes?: string;
}): string {
  const start = new Date(`${apt.date}T${apt.time}:00`);
  const end = new Date(start.getTime() + (apt.duration || 60) * 60 * 1000);

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//InkFlow//FR',
    'BEGIN:VEVENT',
    `UID:${apt.id}@inkflow.app`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:🖋 ${apt.clientName} — ${apt.service}`,
    apt.notes ? `DESCRIPTION:${apt.notes.replace(/\n/g, '\\n')}` : '',
    apt.location ? `LOCATION:${apt.location}` : '',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Rappel RDV InkFlow',
    'TRIGGER:-PT60M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

/** Download an .ics file for a single appointment */
export function downloadICS(apt: Parameters<typeof generateICS>[0]): void {
  const ics = generateICS(apt);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inkflow-rdv-${apt.id.substring(0, 8)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Generate combined .ics for multiple appointments (Apple Calendar, Outlook) */
export function generateICSAll(appointments: Parameters<typeof generateICS>[0][]): string {
  const events = appointments.map(apt => {
    const start = new Date(`${apt.date}T${apt.time}:00`);
    const end = new Date(start.getTime() + (apt.duration || 60) * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    return [
      'BEGIN:VEVENT',
      `UID:${apt.id}@inkflow.app`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:🖋 ${apt.clientName} — ${apt.service}`,
      apt.notes ? `DESCRIPTION:${apt.notes.replace(/\n/g, '\\n')}` : '',
      apt.location ? `LOCATION:${apt.location}` : '',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Rappel RDV InkFlow',
      'TRIGGER:-PT60M',
      'END:VALARM',
      'END:VEVENT',
    ].filter(Boolean).join('\r\n');
  });
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//InkFlow//FR',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

/** Download combined .ics file for all appointments */
export function downloadICSAll(appointments: Parameters<typeof generateICS>[0][]): void {
  const ics = generateICSAll(appointments);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inkflow-agenda-${new Date().toISOString().slice(0, 10)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Generate a Google Calendar quick-add URL (no OAuth needed) */
export function getGoogleCalendarAddUrl(apt: {
  clientName: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  location?: string;
}): string {
  const start = new Date(`${apt.date}T${apt.time}:00`);
  const end = new Date(start.getTime() + (apt.duration || 60) * 60 * 1000);

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `🖋 ${apt.clientName} — ${apt.service}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Rendez-vous InkFlow\nClient: ${apt.clientName}`,
  });

  if (apt.location) params.set('location', apt.location);

  return `https://calendar.google.com/calendar/event?${params.toString()}`;
}
