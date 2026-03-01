import { supabase } from './supabase';

export interface StudioAvailabilityResponse {
  busySlots: Record<string, string[]>;
}

/**
 * Récupère les créneaux occupés pour un studio (appointments + bookings confirmés).
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
  };
}

/** Créneaux horaires par défaut du studio (10h-18h, toutes les 2h) */
export const DEFAULT_TIME_SLOTS = ['10:00', '12:00', '14:00', '16:00', '18:00'];

/** Jours de la semaine désactivés par défaut (0 = Dimanche, 1 = Lundi) */
export const DEFAULT_OFF_DAYS = [0, 1];
