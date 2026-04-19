import { compressImageFileToWebP } from './imageResize';
import { supabase } from './supabase';
import { safeExternalHttpUrl } from './urls';
import type { Booking, BookingStatus, VitrineBookingFormData } from '../types';
import { notifyArtistPushFromDashboard } from './artistPushNotification';
import { isFlashBookingDescription } from './vitrineBookingFlash';

export function mapBookingFromDb(row: Record<string, unknown>): Booking {
  const refImages = row.reference_images;
  const rawAvatar = row.client_avatar_url as string | undefined;
  const clientAvatarUrl = typeof rawAvatar === 'string' && rawAvatar.trim()
    ? safeExternalHttpUrl(rawAvatar.trim()) ?? rawAvatar.trim()
    : undefined;
  return {
    id: row.id as string,
    studioId: row.studio_id as string,
    clientName: row.client_name as string,
    clientEmail: row.client_email as string,
    description: row.description as string,
    requestedDate: row.requested_date as string,
    requestedTime: (row.requested_time as string) ?? null,
    status: (row.status as BookingStatus) || 'pending',
    referenceImages: Array.isArray(refImages) ? (refImages as string[]) : undefined,
    clientAvatarUrl,
    placement: row.placement as string | undefined,
    size: row.size as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

const DEFAULT_LIST_LIMIT = 500;

function normalizeTime(t: string | null): string | null {
  if (!t) return null;
  const s = String(t).trim().toLowerCase();
  if (/^\d{1,2}:\d{2}$/.test(s)) return s;
  if (s === 'morning') return '10:00';
  if (s === 'afternoon') return '14:00';
  if (s === 'evening') return '18:00';
  return s;
}

/**
 * Vérifie en base si le créneau (studio, date, heure) est encore disponible.
 * Utilisé avant de confirmer une demande ou générer un lien Stripe.
 */
export async function isSlotAvailableForBooking(
  studioId: string,
  requestedDate: string,
  requestedTime: string | null,
  excludeBookingId?: string
): Promise<boolean> {
  const targetTime = normalizeTime(requestedTime) || '10:00';

  const { data: confirmedBookings } = await supabase
    .from('inkflow_bookings')
    .select('id, requested_time')
    .eq('studio_id', studioId)
    .eq('requested_date', requestedDate)
    .in('status', ['confirmed', 'accepted']);
  const hasConflict = (confirmedBookings || []).some((b) => {
    if (excludeBookingId && b.id === excludeBookingId) return false;
    const bTime = normalizeTime((b.requested_time as string) ?? null) || '10:00';
    return bTime === targetTime;
  });
  if (hasConflict) return false;

  const { data: conflictingAppointments } = await supabase
    .from('inkflow_appointments')
    .select('id')
    .eq('studio_id', studioId)
    .eq('date', requestedDate)
    .eq('time', targetTime)
    .in('status', ['pending', 'confirmed', 'in_progress', 'completed'])
    .limit(1);
  if (conflictingAppointments && conflictingAppointments.length > 0) return false;

  return true;
}

/** Créneaux testés pour un RDV « placeholder » (projet sans date client) — évite le doublon sur (studio, date, heure). */
const PLACEHOLDER_SLOT_TIMES = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00',
];

/**
 * Trouve le premier créneau où l’on peut insérer un RDV sans violer l’unicité agenda
 * ni chevaucher une réservation vitrine confirmée.
 * Utilisé pour les demandes projet (acompte Stripe) : le client n’a pas encore choisi de date.
 */
export async function findNextAvailableSlotForStudio(
  studioId: string,
): Promise<{ date: string; time: string }> {
  const start = new Date();
  const endLimit = new Date(start);
  endLimit.setDate(endLimit.getDate() + 120);
  const from = start.toISOString().split('T')[0];
  const to = endLimit.toISOString().split('T')[0];

  const { data: occupiedRows, error: occErr } = await supabase
    .from('inkflow_appointments')
    .select('date, time')
    .eq('studio_id', studioId)
    .gte('date', from)
    .lte('date', to);
  if (occErr) throw occErr;

  const occupied = new Set(
    (occupiedRows || []).map((r) => `${String(r.date)}|${String(r.time)}`),
  );

  for (let dayOffset = 0; dayOffset < 120; dayOffset++) {
    const d = new Date(start);
    d.setDate(d.getDate() + dayOffset);
    const dateStr = d.toISOString().split('T')[0];
    for (const time of PLACEHOLDER_SLOT_TIMES) {
      if (occupied.has(`${dateStr}|${time}`)) continue;
      const ok = await isSlotAvailableForBooking(studioId, dateStr, time, undefined);
      if (ok) return { date: dateStr, time };
    }
  }

  throw new Error(
    "Aucun créneau libre trouvé dans les prochains mois. Libérez un horaire dans l'agenda ou déplacez un RDV existant.",
  );
}

export async function getBookingsFromSupabase(studioId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('inkflow_bookings')
    .select('*')
    .eq('studio_id', studioId)
    .order('requested_date', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(DEFAULT_LIST_LIMIT);
  if (error) throw error;
  return (data || []).map(mapBookingFromDb);
}

const BUCKET_BOOKING_REFS = 'inkflow-assets';
const FOLDER_BOOKING_REFS = 'booking-refs';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

/**
 * Upload des images de référence vers Supabase Storage (bucket inkflow-assets/booking-refs).
 * Retourne les URLs publiques des fichiers uploadés.
 * @throws Error si un fichier dépasse 5 Mo
 */
export async function uploadBookingReferenceImages(
  studioId: string,
  files: File[]
): Promise<string[]> {
  if (files.length === 0) return [];
  
  // Validation de la taille des fichiers (max 5 Mo)
  for (const file of files) {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(`L'image "${file.name}" dépasse la taille maximale autorisée (5 Mo)`);
    }
  }
  
  const prefix = `${studioId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const blob = await compressImageFileToWebP(file);
    const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${FOLDER_BOOKING_REFS}/${prefix}_${i}.${ext}`;
    const { data, error } = await supabase.storage
      .from(BUCKET_BOOKING_REFS)
      .upload(path, blob, {
        upsert: false,
        contentType: blob.type || 'image/jpeg',
      });
    if (error) {
      const raw = error.message || '';
      if (/new row violates row-level security|rls|403|denied/i.test(raw)) {
        throw new Error(
          "Envoi de l'image refusé (droits). Déconnectez-vous du compte client puis réessayez, ou contactez le studio.",
        );
      }
      if (/mime|type|not allowed|invalid/i.test(raw)) {
        throw new Error("Format d'image non accepté par le serveur. Utilisez JPG ou PNG.");
      }
      throw new Error(raw || "Impossible d'enregistrer l'image. Réessayez.");
    }
    const { data: urlData } = supabase.storage.from(BUCKET_BOOKING_REFS).getPublicUrl(data.path);
    urls.push(urlData.publicUrl);
  }
  return urls;
}

/**
 * Crée une demande de RDV depuis la vitrine (INSERT public autorisé par RLS).
 * La prévention des doublons (créneau déjà confirmé) est gérée côté dashboard à la confirmation.
 */
export async function createBooking(data: VitrineBookingFormData, studioId: string): Promise<string> {
  const id = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  const ig = data.clientInstagram?.trim();
  const descriptionBody = data.description.trim();
  const description =
    ig ? `${descriptionBody}\n\nInstagram : ${ig}` : descriptionBody;
  const avatarStored = data.clientAvatarUrl?.trim()
    ? safeExternalHttpUrl(data.clientAvatarUrl.trim())
    : null;

  const row = {
    id,
    studio_id: studioId,
    client_name: data.clientName.trim(),
    client_email: data.clientEmail.trim(),
    description,
    requested_date: data.requestedDate,
    requested_time: data.requestedTime?.trim() || null,
    status: 'pending',
    reference_images: data.referenceImages ?? [],
    client_avatar_url: avatarStored,
    created_at: now,
    updated_at: now,
  };

  const { error } = await supabase.from('inkflow_bookings').insert(row);
  if (error) throw new Error(error.message || "Erreur lors de l'envoi de la demande.");

  // Notifier le tatoueur par email (non-bloquant)
  const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-new-booking`;
  fetch(fnUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '' },
    body: JSON.stringify({
      bookingId: id,
      studioId,
      clientName: data.clientName.trim(),
      clientEmail: data.clientEmail.trim(),
      description,
      requestedDate: data.requestedDate,
      requestedTime: data.requestedTime?.trim() || null,
    }),
  }).catch((e) => console.warn('[notify-new-booking] non-critical error:', e));

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
  if (error) {
    if (error.code === '23505' && error.message?.includes('idx_bookings_slot_unique_confirmed')) {
      throw new Error('Ce créneau est déjà réservé pour une autre demande.');
    }
    throw error;
  }

  if (status === 'confirmed' || status === 'accepted') {
    const { data: row } = await supabase
      .from('inkflow_bookings')
      .select('studio_id, description, client_name')
      .eq('id', id)
      .maybeSingle();
    if (row?.studio_id && row.description && isFlashBookingDescription(row.description)) {
      void notifyArtistPushFromDashboard({
        studioId: row.studio_id,
        title: 'Flash confirmé',
        body: `${row.client_name || 'Client'} — demande vitrine confirmée.`,
        url: '/dashboard?tab=requests',
        tag: 'inkflow-flash-confirmed',
      });
    }
  }
}
