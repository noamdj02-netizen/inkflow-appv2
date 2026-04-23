/**
 * Parse fichiers iCalendar (.ics) — Apple Calendrier, Google export, Outlook.
 * Utilise ical.js (navigateur / Vite).
 */
import ICAL from 'ical.js';
import type { Appointment, Client } from '../types';

export interface ParsedIcalEvent {
  uid: string;
  summary: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
  durationMinutes: number;
  isAllDay: boolean;
  /** Exclu de l’import (récurrent, annulé, etc.) */
  excluded: boolean;
  excludeReason?: string;
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatLocalTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

export function normalizePersonName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/** Extrait un libellé « client » depuis le titre d’événement (ex. « Tattoo Jade — dos » → « Jade » heuristique faible : on garde le titre entier tronqué). */
export function clientLabelFromSummary(summary: string): string {
  const s = summary.replace(/\s+/g, ' ').trim();
  if (!s) return 'Client';
  return s.slice(0, 120);
}

export function parseIcsContent(ics: string): ParsedIcalEvent[] {
  const out: ParsedIcalEvent[] = [];
  let comp: ICAL.Component;
  try {
    comp = ICAL.Component.fromString(ics);
  } catch {
    return out;
  }
  const vevents = comp.getAllSubcomponents('vevent');

  for (const vevent of vevents) {
    const ev = new ICAL.Event(vevent);
    const uid = String(ev.uid || `gen-${Math.random().toString(36).slice(2)}`);
    const status = String(vevent.getFirstPropertyValue('status') || '').toUpperCase();
    if (status === 'CANCELLED') {
      out.push({
        uid,
        summary: String(ev.summary || ''),
        description: String(ev.description || ''),
        location: String(ev.location || ''),
        start: new Date(),
        end: new Date(),
        durationMinutes: 60,
        isAllDay: false,
        excluded: true,
        excludeReason: 'Annulé dans le calendrier',
      });
      continue;
    }

    if (ev.isRecurring()) {
      out.push({
        uid,
        summary: String(ev.summary || ''),
        description: String(ev.description || ''),
        location: String(ev.location || ''),
        start: new Date(),
        end: new Date(),
        durationMinutes: 60,
        isAllDay: false,
        excluded: true,
        excludeReason: 'Événement récurrent — non importé (exportez une plage sans récurrence ou une seule occurrence)',
      });
      continue;
    }

    const startTime = ev.startDate;
    if (!startTime) continue;

    const isAllDay = Boolean(startTime.isDate);
    const start = startTime.toJSDate();
    let end: Date;
    if (ev.endDate) {
      end = ev.endDate.toJSDate();
    } else {
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }

    let durationMinutes = Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000));
    if (!Number.isFinite(durationMinutes) || durationMinutes > 24 * 60) {
      durationMinutes = 60;
    }
    if (isAllDay) {
      out.push({
        uid,
        summary: String(ev.summary || ''),
        description: String(ev.description || ''),
        location: String(ev.location || ''),
        start,
        end,
        durationMinutes: 24 * 60,
        isAllDay: true,
        excluded: true,
        excludeReason: 'Journée entière — import réservé aux créneaux horaires',
      });
      continue;
    }

    out.push({
      uid,
      summary: String(ev.summary || 'Sans titre'),
      description: String(ev.description || ''),
      location: String(ev.location || ''),
      start,
      end,
      durationMinutes,
      isAllDay: false,
      excluded: false,
    });
  }

  return out;
}

export function findClientByName(clients: Client[], displayName: string): Client | undefined {
  const n = normalizePersonName(displayName);
  if (!n) return undefined;
  return clients.find((c) => normalizePersonName(c.name) === n);
}

/** Détecte un RDV déjà présent (même jour + même heure + titre proche). */
export function looksLikeDuplicate(
  appointments: { date: string; time: string; clientName: string; service: string }[],
  date: string,
  time: string,
  title: string
): boolean {
  const t = time.slice(0, 5);
  return appointments.some((a) => {
    if (a.date !== date) return false;
    if (a.time.slice(0, 5) !== t) return false;
    const aKey = normalizePersonName(`${a.clientName} ${a.service}`);
    const bKey = normalizePersonName(title);
    return aKey === bKey || aKey.includes(bKey) || bKey.includes(aKey);
  });
}

export function buildAppointmentFromIcal(
  ev: ParsedIcalEvent,
  clientId: string,
  clientName: string,
  clientEmail: string,
  idSuffix: string
): Appointment {
  const date = formatLocalDate(ev.start);
  const time = formatLocalTime(ev.start);
  const id = `apt_ical_${Date.now()}_${idSuffix}`;
  const now = new Date().toISOString();
  return {
    id,
    clientId,
    clientName,
    clientEmail,
    clientPhone: '',
    date,
    time,
    service: ev.summary.slice(0, 500) || 'Import calendrier',
    duration: ev.durationMinutes,
    price: 0,
    deposit: 0,
    depositPaid: false,
    status: 'confirmed',
    tattooType: 'custom',
    location: 'other',
    size: 'medium',
    consentFormSigned: false,
    notes: [ev.description && `Notes (calendrier): ${ev.description}`, ev.location && `Lieu: ${ev.location}`]
      .filter(Boolean)
      .join('\n') || undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export function filterEventsByImportWindow(events: ParsedIcalEvent[], includePast: boolean): ParsedIcalEvent[] {
  if (includePast) return events.filter((e) => !e.excluded);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return events.filter((e) => !e.excluded && e.start >= startOfToday);
}
