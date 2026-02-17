import { supabase } from './supabase';
import type { Booking, BookingStatus, VitrineBookingFormData } from '../types';

export function mapBookingFromDb(row: Record<string, unknown>): Booking {
  return {
    id: row.id as string,
    studioId: row.studio_id as string,
    clientName: row.client_name as string,
    clientEmail: row.client_email as string,
    description: row.description as string,
    requestedDate: row.requested_date as string,
    requestedTime: (row.requested_time as string) ?? null,
    status: (row.status as BookingStatus) || 'pending',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getBookingsFromSupabase(studioId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('inkflow_bookings')
    .select('*')
    .eq('studio_id', studioId)
    .order('requested_date', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapBookingFromDb);
}

/**
 * Crée une demande de RDV depuis la vitrine (INSERT public autorisé par RLS).
 * La prévention des doublons (créneau déjà confirmé) est gérée côté dashboard à la confirmation.
 */
export async function createBooking(data: VitrineBookingFormData, studioId: string): Promise<string> {
  const id = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  const row = {
    id,
    studio_id: studioId,
    client_name: data.clientName.trim(),
    client_email: data.clientEmail.trim(),
    description: data.description.trim(),
    requested_date: data.requestedDate,
    requested_time: data.requestedTime?.trim() || null,
    status: 'pending',
    created_at: now,
    updated_at: now,
  };

  const { error } = await supabase.from('inkflow_bookings').insert(row);
  if (error) throw error;
  return id;
}

/**
 * Met à jour le statut d'une demande (côté dashboard).
 * Empêche d'avoir deux RDV confirmés/acceptés pour la même date (même studio).
 */
export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  if (status === 'confirmed' || status === 'accepted') {
    const { data: row, error: fetchErr } = await supabase
      .from('inkflow_bookings')
      .select('studio_id, requested_date')
      .eq('id', id)
      .single();
    if (fetchErr || !row) throw fetchErr || new Error('Booking not found');
    const { data: existing } = await supabase
      .from('inkflow_bookings')
      .select('id')
      .eq('studio_id', row.studio_id)
      .eq('requested_date', row.requested_date)
      .in('status', ['confirmed', 'accepted'])
      .neq('id', id)
      .limit(1);
    if (Array.isArray(existing) && existing.length > 0) {
      throw new Error('Ce créneau est déjà réservé pour une autre demande.');
    }
  }
  const { error } = await supabase
    .from('inkflow_bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
