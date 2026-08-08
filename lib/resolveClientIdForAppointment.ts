import { supabase } from './supabase';
import type { Appointment } from '../types';

/**
 * Résout l’id CRM pour archiver un PDF dans `client-dossier/{studioId}/{clientId}/`.
 * Utilise `appointment.clientId`, sinon recherche par e-mail dans `inkflow_clients`.
 */
export async function resolveClientIdForAppointment(
  studioId: string,
  appointment: Pick<Appointment, 'clientId' | 'clientEmail'>
): Promise<string | null> {
  const direct = appointment.clientId?.trim();
  if (direct) return direct;

  const email = appointment.clientEmail?.trim();
  if (!email) return null;

  const { data, error } = await supabase
    .from('inkflow_clients')
    .select('id')
    .eq('studio_id', studioId)
    .ilike('email', email)
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) return null;
  return String(data.id);
}
