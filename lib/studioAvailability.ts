import { supabase } from './supabase';

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
 * Récupère les créneaux occupés et les paramètres de disponibilité pour un studio.
 * Utilise l'Edge Function get-studio-availability.
 */
export async function fetchStudioAvailability(studioId: string): Promise<StudioAvailabilityResponse> {
  const { data, error } = await supabase.functions.invoke<StudioAvailabilityResponse>('get-studio-availability', {
    body: { studioId },
  });
  if (error) throw error;
  if (!data) throw new Error('Aucune donnée retournée');
  return {
    busySlots: data.busySlots || {},
    customSlots: data.customSlots || [],
    bookingWindowDays: data.bookingWindowDays ?? 60,
    offDays: Array.isArray(data.offDays) ? data.offDays : null,
    // Nouveaux paramètres avec valeurs par défaut
    slotDuration: data.slotDuration ?? 60,
    bufferTime: data.bufferTime ?? 0,
    overrunMargin: data.overrunMargin ?? 0,
    maxDailyBookings: data.maxDailyBookings ?? 8,
    advanceBookingDays: data.advanceBookingDays ?? 0,
    weeklySchedule: data.weeklySchedule ?? null,
    dynamicSlotsByDay: data.dynamicSlotsByDay ?? null,
  };
}

/** Créneaux horaires par défaut du studio (10h-18h, toutes les 2h) */
export const DEFAULT_TIME_SLOTS = ['10:00', '12:00', '14:00', '16:00', '18:00'];

/** Jours de la semaine désactivés par défaut (0 = Dimanche, 1 = Lundi) */
export const DEFAULT_OFF_DAYS = [0, 1];

/** Noms des jours indexés par leur index (0=dim) */
export const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

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
  return slots.filter(slot => !busyForDate.includes(slot));
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
