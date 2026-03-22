import { supabase } from './supabase';

export interface StudioAvailabilityResponse {
  busySlots: Record<string, string[]>;
  /** Créneaux fixes configurés par le studio. Vide = utiliser DEFAULT_TIME_SLOTS. */
  customSlots: string[];
  /** Fenêtre d'ouverture du planning en jours (0 = illimité). */
  bookingWindowDays: number;
  /** Jours désactivés (0=dim … 6=sam). null = utiliser DEFAULT_OFF_DAYS. */
  offDays: number[] | null;
}

/**
 * Récupère les créneaux occupés et les slots personnalisés pour un studio.
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
  };
}

/** Créneaux horaires par défaut du studio (10h-18h, toutes les 2h) */
export const DEFAULT_TIME_SLOTS = ['10:00', '12:00', '14:00', '16:00', '18:00'];

/** Jours de la semaine désactivés par défaut (0 = Dimanche, 1 = Lundi) */
export const DEFAULT_OFF_DAYS = [0, 1];
