export interface DaySchedule {
  enabled: boolean;
  open: string;
  close: string;
  breaks: { start: string; end: string }[];
}

export interface WeeklySchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

import type { Appointment } from '../types';
import { appointmentsToBusySlots, mergeBusySlots } from './bookingBusySlots';

export interface DaySchedule {
  enabled: boolean;
  open: string;
  close: string;
  breaks: { start: string; end: string }[];
}

export interface WeeklySchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface StudioAvailabilityResponse {
  busySlots: Record<string, string[]>;
  /** Créneaux fixes configurés par le studio. Vide = utiliser DEFAULT_TIME_SLOTS. */
  customSlots: string[];
  /** Fenêtre d'ouverture du planning en jours (0 = illimité). */
  bookingWindowDays: number;
  /** Jours désactivés (0=dim … 6=sam). null = utiliser DEFAULT_OFF_DAYS. */
  offDays: number[] | null;

  // Nouveaux paramètres avancés
  /** Durée d'un créneau en minutes (30, 60, 90, 120) */
  slotDuration: number;
  /** Pause entre 2 clients en minutes (buffer) */
  bufferTime: number;
  /** Marge de sécurité pour pièces complexes en minutes */
  overrunMargin: number;
  /** Nombre max de RDV par jour */
  maxDailyBookings: number;
  /** Délai minimum de réservation en jours */
  advanceBookingDays: number;
  /** Planning hebdomadaire avec horaires par jour et pauses */
  weeklySchedule: WeeklySchedule | null;
  /** Créneaux dynamiques pré-calculés par jour de la semaine (0=dim...6=sam) */
  dynamicSlotsByDay: Record<number, string[]> | null;
}

/**
 * Repli si l’Edge Function `get-studio-availability` est indisponible (non déployée, 5xx, réseau).
 * Créneaux type vitrine sans créneaux occupés — le tatoueur peut quand même proposer une date.
 */
export function createFallbackAvailabilityResponse(): StudioAvailabilityResponse {
  return {
    busySlots: {},
    customSlots: [],
    bookingWindowDays: 60,
    offDays: null,
    slotDuration: 60,
    bufferTime: 0,
    overrunMargin: 0,
    maxDailyBookings: 8,
    advanceBookingDays: 0,
    weeklySchedule: null,
    dynamicSlotsByDay: null,
  };
}

function normalizeAvailabilityPayload(
  data: StudioAvailabilityResponse
): StudioAvailabilityResponse {
  return {
    busySlots: data.busySlots || {},
    customSlots: data.customSlots || [],
    bookingWindowDays: data.bookingWindowDays ?? 60,
    offDays: Array.isArray(data.offDays) ? data.offDays : null,
    slotDuration: data.slotDuration ?? 60,
    bufferTime: data.bufferTime ?? 0,
    overrunMargin: data.overrunMargin ?? 0,
    maxDailyBookings: data.maxDailyBookings ?? 8,
    advanceBookingDays: data.advanceBookingDays ?? 0,
    weeklySchedule: data.weeklySchedule ?? null,
    dynamicSlotsByDay: data.dynamicSlotsByDay ?? null,
  };
}

export type FetchStudioAvailabilityMeta = {
  availability: StudioAvailabilityResponse;
  /** True si l’Edge Function a échoué et que les dispos par défaut ont été utilisées */
  usedFallback: boolean;
};

/**
 * Comme {@link fetchStudioAvailability} mais indique si le repli local a été utilisé (affichage UI).
 *
 * Appel via `fetch` et clé **anon** (comme `createCheckoutSession`) : évite d’envoyer le JWT de session,
 * souvent cause de `FunctionsHttpError` sur les pages publiques (JWT expiré ou autre projet).
 */
export async function fetchStudioAvailabilityMeta(
  studioId: string
): Promise<FetchStudioAvailabilityMeta> {
  const baseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  if (!baseUrl || !anonKey) {
    console.warn(
      '[InkFlow] get-studio-availability: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants.'
    );
    return {
      availability: createFallbackAvailabilityResponse(),
      usedFallback: true,
    };
  }
  try {
    const res = await fetch(`${baseUrl}/functions/v1/get-studio-availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({ studioId }),
    });
    const data = (await res.json().catch(() => ({}))) as
      | StudioAvailabilityResponse
      | { error?: string };
    if (!res.ok) {
      const msg =
        typeof data === 'object' &&
        data &&
        'error' in data &&
        typeof (data as { error?: string }).error === 'string'
          ? (data as { error: string }).error
          : `HTTP ${res.status}`;
      throw new Error(msg);
    }
    if (!data || typeof data !== 'object') throw new Error('Aucune donnée retournée');
    if ('error' in data && !('busySlots' in data)) {
      throw new Error(
        typeof (data as { error?: string }).error === 'string'
          ? (data as { error: string }).error
          : 'Erreur serveur'
      );
    }
    return {
      availability: normalizeAvailabilityPayload(data as StudioAvailabilityResponse),
      usedFallback: false,
    };
  } catch (e) {
    console.warn(
      '[InkFlow] get-studio-availability indisponible, repli sur dispos par défaut.',
      studioId,
      e
    );
    return {
      availability: createFallbackAvailabilityResponse(),
      usedFallback: true,
    };
  }
}

/**
 * Récupère les créneaux occupés et les paramètres de disponibilité pour un studio.
 * Utilise l'Edge Function get-studio-availability.
 * Ne rejette jamais : en cas d’échec, retourne {@link createFallbackAvailabilityResponse} (log console).
 */
export async function fetchStudioAvailability(
  studioId: string
): Promise<StudioAvailabilityResponse> {
  const { availability } = await fetchStudioAvailabilityMeta(studioId);
  return availability;
}

/** Créneaux horaires par défaut du studio (10h-18h, toutes les 2h) */
export const DEFAULT_TIME_SLOTS = ['10:00', '12:00', '14:00', '16:00', '18:00'];

/** Jours de la semaine désactivés par défaut (0 = Dimanche, 1 = Lundi) */
export const DEFAULT_OFF_DAYS = [0, 1];

/** Noms des jours indexés par leur index (0=dim) */
export const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

/**
 * Retourne les créneaux disponibles pour une date donnée en tenant compte
 * des paramètres avancés (weeklySchedule, dynamicSlotsByDay, buffers, etc.)
 */
export function getAvailableSlotsForDate(
  date: Date,
  availability: StudioAvailabilityResponse
): string[] {
  const dateStr = date.toISOString().split('T')[0];
  const dayIndex = date.getDay();
  const busyForDate = availability.busySlots[dateStr] || [];

  // Si le jour est bloqué ou complet
  if (busyForDate.includes('__blocked__') || busyForDate.includes('__full__')) {
    return [];
  }

  // Déterminer les créneaux possibles
  let slots: string[];

  if (availability.dynamicSlotsByDay && availability.dynamicSlotsByDay[dayIndex]) {
    // Utiliser les créneaux dynamiques pré-calculés par l'Edge Function
    slots = availability.dynamicSlotsByDay[dayIndex];
  } else if (availability.customSlots.length > 0) {
    // Utiliser les créneaux personnalisés
    slots = availability.customSlots;
  } else {
    // Utiliser les créneaux par défaut
    slots = DEFAULT_TIME_SLOTS;
  }

  // Filtrer les créneaux occupés
  return slots.filter((slot) => !busyForDate.includes(slot));
}

/**
 * Retourne les dates disponibles dans la fenêtre de réservation
 */
export function getAvailableDates(
  availability: StudioAvailabilityResponse,
  startDate: Date = new Date()
): Date[] {
  const dates: Date[] = [];
  const offDays = availability.offDays ?? DEFAULT_OFF_DAYS;
  const windowDays = availability.bookingWindowDays || 60;
  const advanceDays = availability.advanceBookingDays || 0;

  // Commencer après le délai minimum de réservation
  const actualStart = new Date(startDate);
  actualStart.setDate(actualStart.getDate() + advanceDays);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + windowDays);

  for (let d = new Date(actualStart); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayIndex = d.getDay();

    // Ignorer les jours fermés
    if (offDays.includes(dayIndex)) continue;

    // Vérifier si le jour a des créneaux disponibles
    const slots = getAvailableSlotsForDate(new Date(d), availability);
    if (slots.length > 0) {
      dates.push(new Date(d));
    }
  }

  return dates;
}

/**
 * Fusionne le planning serveur (Edge) avec les RDV déjà chargés dans le dashboard
 * (agenda, demandes) pour éviter les doubles réservations en saisie manuelle.
 */
export function withMergedAppointmentBusySlots(
  availability: StudioAvailabilityResponse,
  appointments: Appointment[] | undefined
): StudioAvailabilityResponse {
  if (!appointments?.length) return availability;
  const localBusy = appointmentsToBusySlots(appointments);
  return {
    ...availability,
    busySlots: mergeBusySlots(availability.busySlots, localBusy),
  };
}
