import { supabase, getStudioId } from './supabase';
import type { VitrineData } from '../types/vitrine';
import type { Appointment, Client, FlashDesign, Notification, ProjectRequest, ProjectRequestStatus } from '../types';
import type { DashboardWidget } from '../components/dashboard/DashboardWidgets';

function getStudioSlug(studioName: string): string {
  return (studioName || 'mon-studio')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-') || 'mon-studio';
}

async function ensureStudio(email: string, name: string, studioName: string): Promise<string> {
  const id = getStudioId(email, studioName);
  const slug = getStudioSlug(studioName);
  const { error } = await supabase.from('inkflow_studios').upsert(
    { id, email, name, studio_name: studioName, slug, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  );
  if (error) throw error;
  return id;
}

// Vitrine data
export async function getVitrineDataFromSupabase(studioId: string, defaultData: VitrineData): Promise<VitrineData> {
  const { data, error } = await supabase.from('inkflow_vitrine_data').select('data').eq('studio_id', studioId).single();
  if (error || !data?.data) return defaultData;
  return { ...defaultData, ...(data.data as object), slug: defaultData.slug } as VitrineData;
}

/** Récupère le studio_id à partir du slug (pour la page publique) */
export async function getStudioIdBySlug(slug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('inkflow_studios')
    .select('id')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle();
  if (error || !data?.id) return null;
  return data.id;
}

/** Récupère les données vitrine par slug (pour la page publique /studio/:slug) */
export async function getVitrineDataBySlugFromSupabase(slug: string, defaultData: VitrineData): Promise<VitrineData> {
  const studioId = await getStudioIdBySlug(slug);
  if (!studioId) return defaultData;
  return getVitrineDataFromSupabase(studioId, defaultData);
}

export async function saveVitrineDataToSupabase(studioId: string, data: VitrineData): Promise<void> {
  const { error } = await supabase.from('inkflow_vitrine_data').upsert(
    { studio_id: studioId, data: data as unknown as object, updated_at: new Date().toISOString() },
    { onConflict: 'studio_id' }
  );
  if (error) throw error;
}

// Widgets
export async function getWidgetsFromSupabase(studioId: string): Promise<DashboardWidget[]> {
  const { data, error } = await supabase.from('inkflow_widgets').select('widgets').eq('studio_id', studioId).single();
  if (error || !data?.widgets) return [];
  return data.widgets as DashboardWidget[];
}

export async function saveWidgetsToSupabase(studioId: string, widgets: DashboardWidget[]): Promise<void> {
  const { error } = await supabase.from('inkflow_widgets').upsert(
    { studio_id: studioId, widgets: widgets as unknown as object[], updated_at: new Date().toISOString() },
    { onConflict: 'studio_id' }
  );
  if (error) throw error;
}

// Vitrine link settings
export async function getVitrineLinkSettingsFromSupabase(studioId: string): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.from('inkflow_vitrine_link_settings').select('settings').eq('studio_id', studioId).single();
  if (error || !data?.settings) return {};
  return data.settings as Record<string, unknown>;
}

export async function saveVitrineLinkSettingsToSupabase(studioId: string, settings: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('inkflow_vitrine_link_settings').upsert(
    { studio_id: studioId, settings, updated_at: new Date().toISOString() },
    { onConflict: 'studio_id' }
  );
  if (error) throw error;
}

// Payment settings
export async function getPaymentSettingsFromSupabase(studioId: string): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.from('inkflow_payment_settings').select('settings').eq('studio_id', studioId).single();
  if (error || !data?.settings) return {};
  return data.settings as Record<string, unknown>;
}

export async function savePaymentSettingsToSupabase(studioId: string, settings: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('inkflow_payment_settings').upsert(
    { studio_id: studioId, settings, updated_at: new Date().toISOString() },
    { onConflict: 'studio_id' }
  );
  if (error) throw error;
}

// Care templates
export async function getCareTemplatesFromSupabase(studioId: string): Promise<unknown[]> {
  const { data, error } = await supabase.from('inkflow_care_templates').select('templates').eq('studio_id', studioId).single();
  if (error || !data?.templates) return [];
  return data.templates as unknown[];
}

export async function saveCareTemplatesToSupabase(studioId: string, templates: unknown[]): Promise<void> {
  const { error } = await supabase.from('inkflow_care_templates').upsert(
    { studio_id: studioId, templates, updated_at: new Date().toISOString() },
    { onConflict: 'studio_id' }
  );
  if (error) throw error;
}

// Clients
function mapClientFromDb(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    phone: (row.phone as string) || '',
    totalSpent: Number(row.total_spent) || 0,
    appointmentsCount: Number(row.appointments_count) || 0,
    lastVisit: row.last_visit as string | undefined,
    firstVisit: (row.first_visit as string) || new Date().toISOString().split('T')[0],
    status: (row.status as Client['status']) || 'active',
    tags: (row.tags as string[]) || [],
    tattoos: (row.tattoos as Client['tattoos']) || [],
    notes: row.notes as string | undefined
  };
}

export async function getClientsFromSupabase(studioId: string): Promise<Client[]> {
  const { data, error } = await supabase.from('inkflow_clients').select('*').eq('studio_id', studioId).order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapClientFromDb);
}

export async function saveClientToSupabase(studioId: string, client: Client): Promise<string> {
  const row = {
    id: client.id,
    studio_id: studioId,
    name: client.name,
    email: client.email,
    phone: client.phone || null,
    total_spent: client.totalSpent,
    appointments_count: client.appointmentsCount,
    last_visit: client.lastVisit || null,
    first_visit: client.firstVisit,
    status: client.status,
    tags: client.tags,
    tattoos: client.tattoos,
    notes: client.notes || null,
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from('inkflow_clients').upsert(row, { onConflict: 'id' });
  if (error) throw error;
  return client.id;
}

export async function deleteClientFromSupabase(clientId: string): Promise<void> {
  const { error } = await supabase.from('inkflow_clients').delete().eq('id', clientId);
  if (error) throw error;
}

// Client notes
export async function getClientNotesFromSupabase(clientId: string): Promise<string> {
  const { data, error } = await supabase.from('inkflow_client_notes').select('notes').eq('client_id', clientId).single();
  if (error || !data) return '';
  return (data.notes as string) || '';
}

export async function saveClientNotesToSupabase(clientId: string, notes: string): Promise<void> {
  const { error } = await supabase.from('inkflow_client_notes').upsert(
    { client_id: clientId, notes, updated_at: new Date().toISOString() },
    { onConflict: 'client_id' }
  );
  if (error) throw error;
}

// Appointments
function mapAppointmentFromDb(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as string,
    clientId: (row.client_id as string) || '',
    clientName: row.client_name as string,
    clientEmail: row.client_email as string,
    clientPhone: (row.client_phone as string) || '',
    date: row.date as string,
    time: row.time as string,
    service: row.service as string,
    duration: Number(row.duration) || 60,
    price: Number(row.price) || 0,
    deposit: Number(row.deposit) || 0,
    depositPaid: Boolean(row.deposit_paid),
    status: (row.status as Appointment['status']) || 'pending',
    tattooType: (row.tattoo_type as Appointment['tattooType']) || 'custom',
    flashId: row.flash_id as string | undefined,
    location: (row.location as Appointment['location']) || 'arm',
    size: (row.size as Appointment['size']) || 'medium',
    consentFormSigned: Boolean(row.consent_form_signed),
    createdAt: (row.created_at as string) || new Date().toISOString(),
    updatedAt: (row.updated_at as string) || new Date().toISOString()
  };
}

export async function getAppointmentsFromSupabase(studioId: string): Promise<Appointment[]> {
  const { data, error } = await supabase.from('inkflow_appointments').select('*').eq('studio_id', studioId).order('date', { ascending: true }).order('time', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapAppointmentFromDb);
}

export async function saveAppointmentToSupabase(studioId: string, apt: Appointment): Promise<void> {
  const row = {
    id: apt.id,
    studio_id: studioId,
    client_id: apt.clientId || null,
    client_name: apt.clientName,
    client_email: apt.clientEmail,
    client_phone: apt.clientPhone || null,
    date: apt.date,
    time: apt.time,
    service: apt.service,
    duration: apt.duration,
    price: apt.price,
    deposit: apt.deposit,
    deposit_paid: apt.depositPaid,
    status: apt.status,
    tattoo_type: apt.tattooType,
    flash_id: apt.flashId || null,
    location: apt.location || null,
    size: apt.size || null,
    consent_form_signed: apt.consentFormSigned,
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from('inkflow_appointments').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteAppointmentFromSupabase(aptId: string): Promise<void> {
  const { error } = await supabase.from('inkflow_appointments').delete().eq('id', aptId);
  if (error) throw error;
}

// Flash designs
function mapFlashFromDb(row: Record<string, unknown>): FlashDesign {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | undefined,
    imageUrl: (row.image_url as string) || '',
    price: Number(row.price) || 0,
    depositAmount: Number(row.deposit_amount) || 0,
    available: Boolean(row.available),
    reserved: Boolean(row.reserved),
    category: (row.category as string) || '',
    size: (row.size as FlashDesign['size']) || 'small',
    placement: (row.placement as string[]) || [],
    estimatedDuration: Number(row.estimated_duration) || 60,
    tags: (row.tags as string[]) || [],
    createdAt: (row.created_at as string) || new Date().toISOString()
  };
}

export async function getFlashDesignsFromSupabase(studioId: string): Promise<FlashDesign[]> {
  const { data, error } = await supabase.from('inkflow_flash_designs').select('*').eq('studio_id', studioId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapFlashFromDb);
}

export async function saveFlashDesignToSupabase(studioId: string, flash: FlashDesign): Promise<void> {
  const row = {
    id: flash.id,
    studio_id: studioId,
    title: flash.title,
    description: flash.description || null,
    image_url: flash.imageUrl || null,
    price: flash.price,
    deposit_amount: flash.depositAmount,
    available: flash.available,
    reserved: flash.reserved,
    category: flash.category || null,
    size: flash.size,
    placement: flash.placement || [],
    estimated_duration: flash.estimatedDuration,
    tags: flash.tags || [],
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from('inkflow_flash_designs').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteFlashDesignFromSupabase(flashId: string): Promise<void> {
  const { error } = await supabase.from('inkflow_flash_designs').delete().eq('id', flashId);
  if (error) throw error;
}

// Notifications
function mapNotificationFromDb(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    type: row.type as Notification['type'],
    title: row.title as string,
    message: row.message as string,
    read: Boolean(row.read),
    createdAt: (row.created_at as string) || new Date().toISOString(),
    actionUrl: row.action_url as string | undefined
  };
}

export async function getNotificationsFromSupabase(studioId: string): Promise<Notification[]> {
  const { data, error } = await supabase.from('inkflow_notifications').select('*').eq('studio_id', studioId).order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return (data || []).map(mapNotificationFromDb);
}

export async function markNotificationReadInSupabase(notificationId: string): Promise<void> {
  const { error } = await supabase.from('inkflow_notifications').update({ read: true }).eq('id', notificationId);
  if (error) throw error;
}

// Project requests (Demandes de projet)
function mapProjectRequestFromDb(row: Record<string, unknown>): ProjectRequest {
  return {
    id: row.id as string,
    studioId: row.studio_id as string,
    clientName: row.client_name as string,
    clientEmail: row.client_email as string,
    clientInstagram: row.client_instagram as string | undefined,
    description: row.description as string,
    placement: row.placement as string | undefined,
    size: row.size as string | undefined,
    budget: row.budget as string | undefined,
    status: (row.status as ProjectRequestStatus) || 'PENDING',
    referenceImages: (row.reference_images as string[]) || [],
    createdAt: (row.created_at as string) || new Date().toISOString()
  };
}

export async function getProjectRequestsFromSupabase(studioId: string): Promise<ProjectRequest[]> {
  const { data, error } = await supabase
    .from('inkflow_project_requests')
    .select('*')
    .eq('studio_id', studioId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapProjectRequestFromDb);
}

export async function updateProjectRequestStatus(id: string, status: ProjectRequestStatus): Promise<void> {
  const { error } = await supabase.from('inkflow_project_requests').update({ status }).eq('id', id);
  if (error) throw error;
}

export { ensureStudio, getStudioId };
