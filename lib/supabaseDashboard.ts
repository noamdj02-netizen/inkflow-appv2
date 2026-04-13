import { supabase, getStudioId } from './supabase';
import { buildFlashSlug } from './flashSlug';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = supabase;
import { sendReferralNotification } from './sendNotification';
import type { VitrineData } from '../types/vitrine';
import type { Appointment, Client, FlashDesign, LoyaltyEntry, LoyaltyTier, Notification, ProjectRequest, ProjectRequestStatus, WaitlistEntry } from '../types';
import type { LoyaltySettings } from '../components/dashboard/LoyaltyManager';
import type { DashboardWidget } from '../components/dashboard/DashboardWidgets';
import type { StudioDashboardPreferences } from '../types/studioPreferences';
import { DEFAULT_STUDIO_DASHBOARD_PREFERENCES, STUDIO_PREFERENCES_SCHEMA_VERSION } from '../types/studioPreferences';

export function getStudioSlug(studioName: string): string {
  return (studioName || 'mon-studio')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-') || 'mon-studio';
}

/** Slug URL vitrine (/studio/:slug) — toujours comparer en minuscules (évite les ratés RPC si la casse diverge). */
export function normalizePublicStudioSlug(slug: string): string {
  return (slug || '').trim().toLowerCase();
}

/** Suffixe déterministe à partir de l'id pour rendre un slug unique */
function uniqueSlugSuffix(id: string): string {
  const hash = Math.abs(
    Array.from(id).reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0)
  );
  return hash.toString(36).slice(0, 8);
}

/**
 * Crée ou met à jour le studio de l'utilisateur connecté.
 * Garantit un slug UNIQUE par studio (évite vitrines et réservations partagées).
 * Retourne l'id du studio et le slug à utiliser pour la vitrine (lien public).
 * Si referralCode est fourni, lie le studio au parrain (referred_by) et crée l'entrée inkflow_referrals.
 */
export async function ensureStudio(
  email: string,
  name: string,
  studioName: string,
  referralCode?: string | null
): Promise<{ studioId: string; slug: string }> {
  const emailNorm = email.trim().toLowerCase();
  /** Un seul studio par email : évite un 2e essai d’inscription avec un autre nom de studio → 2e ligne / 2e trial. */
  const existingByEmail = await getStudioByEmail(emailNorm);
  if (existingByEmail?.id) {
    const now = new Date().toISOString();
    await supabase
      .from('inkflow_studios')
      .update({ name, studio_name: studioName, updated_at: now })
      .eq('id', existingByEmail.id);
    return { studioId: existingByEmail.id, slug: existingByEmail.slug };
  }

  const id = getStudioId(emailNorm, studioName);
  const baseSlug = getStudioSlug(studioName);
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from('inkflow_studios')
    .select('id, slug')
    .eq('slug', baseSlug)
    .maybeSingle();

  let preferredSlug: string;
  if (!existing) {
    preferredSlug = baseSlug;
  } else if (existing.id === id) {
    preferredSlug = baseSlug;
  } else {
    preferredSlug = `${baseSlug}-${uniqueSlugSuffix(id)}`;
  }

  let referredBy: string | null = null;
  if (referralCode?.trim()) {
    const code = referralCode.trim().toUpperCase();
    const { data: referrer } = await supabase
      .from('inkflow_studios')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle();
    if (referrer?.id && referrer.id !== id) {
      referredBy = referrer.id;
    }
  }

  const MAX_SLUG_ATTEMPTS = 8;
  let lastError: { message?: string; code?: string } | null = null;

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const finalSlug =
      attempt === 0
        ? preferredSlug
        : `${baseSlug}-${uniqueSlugSuffix(`${id}-retry-${attempt}-${Date.now()}`)}`;

    const payload: Record<string, unknown> = {
      id,
      email: emailNorm,
      name,
      studio_name: studioName,
      slug: finalSlug,
      updated_at: now,
    };
    if (referredBy) payload.referred_by = referredBy;

    const { error } = await (supabase as any).from('inkflow_studios').upsert(payload, { onConflict: 'id' });
    if (!error) {
      if (referredBy) {
        const { error: refErr } = await supabase.from('inkflow_referrals').insert({
          referrer_id: referredBy,
          referee_id: id,
          status: 'pending',
        });
        if (refErr && refErr.code !== '23505') {
          console.warn('[ensureStudio] referral insert:', refErr.message);
        } else if (!refErr) {
          sendReferralNotification({ referrerId: referredBy, refereeStudioName: studioName });
        }
      }
      return { studioId: id, slug: finalSlug };
    }

    lastError = error as { message?: string; code?: string };
    const code = lastError.code;
    if (code === '23505') {
      continue;
    }
    const msg = lastError.message || code || 'Supabase error';
    throw new Error(msg);
  }

  throw new Error(
    lastError?.message ||
      'Impossible d’attribuer un slug unique (contrainte inkflow_studios.slug). Réessaie ou change le nom du studio.'
  );
}

/** Récupère le studio (id + slug + subscription_status + trial_ends_at + siret + plan CSV quota) pour cet email.
 * Privilégie le studio avec le plus de clients et RDV (évite studio vide si plusieurs studios). */
export async function getStudioByEmail(email: string): Promise<{
  id: string;
  slug: string;
  subscription_status?: string;
  trial_ends_at?: string | null;
  siret?: string | null;
  plan_type?: string;
  csv_import_slots_remaining?: number | null;
} | null> {
  const { data, error } = await supabase.rpc('get_studio_by_email_with_data', { p_email: email });
  const row = Array.isArray(data) ? data[0] : data;
  if (!error && row?.id) {
    return {
      id: row.id as string,
      slug: (row.slug as string) ?? getStudioSlug('Mon studio'),
      subscription_status: row.subscription_status as string | undefined,
      trial_ends_at: row.trial_ends_at as string | null | undefined,
      siret: (row.siret as string | null) ?? null,
      plan_type: row.plan_type as string | undefined,
      csv_import_slots_remaining: row.csv_import_slots_remaining as number | null | undefined,
    };
  }
  // Fallback si la RPC n'existe pas encore (migration non appliquée)
  const { data: fallback, error: fallbackError } = await supabase
    .from('inkflow_studios')
    .select('id, slug, subscription_status, trial_ends_at, siret, plan_type, csv_import_slots_remaining')
    .eq('email', email)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (fallbackError || !fallback?.id) return null;
  return {
    id: fallback.id,
    slug: (fallback.slug as string) ?? getStudioSlug('Mon studio'),
    subscription_status: fallback.subscription_status as string | undefined,
    trial_ends_at: fallback.trial_ends_at as string | null | undefined,
    siret: (fallback.siret as string | null) ?? null,
    plan_type: (fallback as { plan_type?: string }).plan_type,
    csv_import_slots_remaining: (fallback as { csv_import_slots_remaining?: number | null }).csv_import_slots_remaining,
  };
}

/**
 * URL d’avatar studio persistée (`inkflow_studios.avatar_url`).
 * À la déconnexion le localStorage est vidé : il faut relire la base au login pour retrouver la photo.
 */
export async function getStudioAvatarUrlByEmail(email: string): Promise<string | null> {
  const emailNorm = email.trim().toLowerCase();
  if (!emailNorm) return null;
  const { data: rows, error } = await supabase
    .from('inkflow_studios')
    .select('avatar_url')
    .ilike('email', emailNorm)
    .order('updated_at', { ascending: false })
    .limit(1);
  if (error || !rows?.length) return null;
  const url = (rows[0] as { avatar_url?: string | null }).avatar_url?.trim();
  return url || null;
}

/** Récupère le slug du studio depuis la base (pour le dashboard quand on a déjà studioId). */
export async function getStudioSlugByStudioId(studioId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('inkflow_studios')
    .select('slug')
    .eq('id', studioId)
    .maybeSingle();
  if (error || !data?.slug) return null;
  return data.slug;
}

/** Vérifie si un slug est disponible (non pris par un autre studio). Si excludeStudioId est fourni, le slug est considéré dispo si c'est le nôtre. */
export async function checkSlugAvailable(slug: string, excludeStudioId?: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('get_studio_public_by_slug', { p_slug: normalizePublicStudioSlug(slug) });
  if (error) {
    console.warn('[checkSlugAvailable] RPC error — slug traité comme indisponible:', error.message);
    return false;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) return true;
  if (excludeStudioId && row.id === excludeStudioId) return true;
  return false;
}

/** Met à jour le slug du studio. Le slug doit être validé (minuscules, chiffres, tirets) et disponible. */
export async function updateStudioSlug(studioId: string, newSlug: string): Promise<void> {
  const { error } = await supabase
    .from('inkflow_studios')
    .update({ slug: newSlug, updated_at: new Date().toISOString() })
    .eq('id', studioId);
  if (error) throw error;
}

/** Récupère le thème vitrine du studio. */
export async function getStudioVitrineTheme(studioId: string): Promise<string> {
  const { data, error } = await supabase
    .from('inkflow_studios')
    .select('vitrine_theme')
    .eq('id', studioId)
    .maybeSingle();
  if (error || !data?.vitrine_theme) return 'light';
  return data.vitrine_theme as string;
}

/** Récupère les IDs des thèmes PRO débloqués par achat pour le studio. */
export async function getStudioUnlockedThemes(studioId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('inkflow_studios')
    .select('unlocked_themes')
    .eq('id', studioId)
    .maybeSingle();
  if (error || !data?.unlocked_themes) return [];
  const arr = data.unlocked_themes as unknown;
  return Array.isArray(arr) ? (arr as string[]) : [];
}

/** Met à jour le thème vitrine du studio. */
export async function updateStudioVitrineTheme(studioId: string, themeId: string): Promise<void> {
  const { error } = await supabase
    .from('inkflow_studios')
    .update({ vitrine_theme: themeId, updated_at: new Date().toISOString() })
    .eq('id', studioId);
  if (error) throw error;
}

export interface ReferralWithReferee {
  id: string;
  refereeStudioName: string | null;
  status: string;
  created_at: string;
}

/** Récupère les parrainages du studio (en tant que parrain) avec les noms des filleuls. */
export async function getReferralsForReferrer(studioId: string): Promise<ReferralWithReferee[]> {
  const { data: referrals, error } = await supabase
    .from('inkflow_referrals')
    .select('id, referee_id, status, created_at')
    .eq('referrer_id', studioId)
    .order('created_at', { ascending: false });
  if (error || !referrals?.length) return [];
  const refereeIds = [...new Set((referrals as { referee_id: string }[]).map((r) => r.referee_id))];
  const { data: studios } = await supabase
    .from('inkflow_studios')
    .select('id, studio_name, name')
    .in('id', refereeIds);
  const nameByRefereeId = new Map<string, string>();
  (studios ?? []).forEach((s) => {
    const name = (s as { studio_name?: string; name?: string }).studio_name ?? (s as { studio_name?: string; name?: string }).name ?? null;
    if (name) nameByRefereeId.set((s as { id: string }).id, name);
  });
  return (referrals as { id: string; referee_id: string; status: string; created_at: string }[]).map((r) => ({
    id: r.id,
    refereeStudioName: nameByRefereeId.get(r.referee_id) ?? null,
    status: r.status,
    created_at: r.created_at,
  }));
}

// Vitrine data
export async function getVitrineDataFromSupabase(studioId: string, defaultData: VitrineData): Promise<VitrineData> {
  const { data, error } = await supabase.from('inkflow_vitrine_data').select('data').eq('studio_id', studioId).single();
  if (error || !data?.data) return defaultData;
  return { ...defaultData, ...(data.data as object), slug: defaultData.slug } as VitrineData;
}

/** Récupère le studio_id à partir du slug (pour la page publique). Utilise la RPC sécurisée pour ne pas exposer les emails. */
export async function getStudioIdBySlug(slug: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_studio_public_by_slug', { p_slug: normalizePublicStudioSlug(slug) });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row?.id) return null;
  return row.id as string;
}

/** Récupère id + thème + SIRET + URLs photo studio (repli vitrine) à partir du slug. */
export async function getStudioPublicBySlug(slug: string): Promise<{
  id: string;
  vitrineTheme: string;
  siret?: string | null;
  avatarUrl: string | null;
  portfolioCoverUrl: string | null;
} | null> {
  const { data, error } = await supabase.rpc('get_studio_public_by_slug', { p_slug: normalizePublicStudioSlug(slug) });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row?.id) return null;
  return {
    id: row.id as string,
    vitrineTheme: (row.vitrine_theme as string) || 'light',
    siret: (row.siret as string | null) ?? null,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    portfolioCoverUrl: (row.portfolio_cover_url as string | null) ?? null,
  };
}

/** Récupère les données vitrine par slug (pour la page publique /studio/:slug). Inclut le thème et SIRET du studio. */
export async function getVitrineDataBySlugFromSupabase(slug: string, defaultData: VitrineData): Promise<VitrineData> {
  const normalized = normalizePublicStudioSlug(slug);
  const studio = await getStudioPublicBySlug(normalized);
  if (!studio) return { ...defaultData, slug: normalized };
  const data = await getVitrineDataFromSupabase(studio.id, { ...defaultData, slug: normalized });

  const rowAvatar = studio.avatarUrl?.trim() || '';
  const rowCover = studio.portfolioCoverUrl?.trim() || '';
  let coverImage = (data.coverImage || '').trim();
  let avatar = (data.avatar || '').trim();
  const firstPortfolioUrl = (data.portfolio ?? []).map((p) => p.url?.trim()).find(Boolean) || '';

  if (!coverImage) {
    if (rowCover) coverImage = rowCover;
    else if (rowAvatar) coverImage = rowAvatar;
    else if (firstPortfolioUrl) coverImage = firstPortfolioUrl;
  }
  if (!avatar && rowAvatar) avatar = rowAvatar;

  return {
    ...data,
    slug: normalized,
    coverImage,
    avatar,
    theme: studio.vitrineTheme,
    siret: studio.siret ?? undefined,
  };
}

export async function saveVitrineDataToSupabase(studioId: string, data: VitrineData): Promise<void> {
  const { error } = await db.from('inkflow_vitrine_data').upsert(
    { studio_id: studioId, data, updated_at: new Date().toISOString() },
    { onConflict: 'studio_id' }
  );
  if (error) throw error;
}

// Widgets (maybeSingle évite 406 quand aucune ligne n'existe encore)
export async function getWidgetsFromSupabase(studioId: string): Promise<DashboardWidget[]> {
  const { data, error } = await supabase.from('inkflow_widgets').select('widgets').eq('studio_id', studioId).maybeSingle();
  if (error || !data?.widgets) return [];
  return data.widgets as unknown as DashboardWidget[];
}

export async function saveWidgetsToSupabase(studioId: string, widgets: DashboardWidget[]): Promise<void> {
  const { error } = await db.from('inkflow_widgets').upsert(
    { studio_id: studioId, widgets, updated_at: new Date().toISOString() },
    { onConflict: 'studio_id' }
  );
  if (error) throw error;
}

/** Ordre des widgets Vue d'ensemble (KPI + personnalisés) */
export async function getWidgetOrderFromSupabase(studioId: string): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('inkflow_widgets') as any)
    .select('widget_order').eq('studio_id', studioId).maybeSingle();
  if (error || !data?.widget_order) return [];
  const arr: unknown = data.widget_order;
  if (!Array.isArray(arr)) return [];
  return arr.filter((id): id is string => typeof id === 'string');
}

export async function saveWidgetOrderToSupabase(studioId: string, order: string[]): Promise<void> {
  const { data: existing } = await supabase.from('inkflow_widgets').select('widgets').eq('studio_id', studioId).maybeSingle();
  const widgets = (existing?.widgets as unknown[]) ?? [];
  const { error } = await db.from('inkflow_widgets').upsert(
    { studio_id: studioId, widgets, widget_order: order, updated_at: new Date().toISOString() },
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

/** Récupère les réglages lien vitrine par slug (page publique sans auth). Nécessite la policy vitrine_link_public_select. */
export async function getVitrineLinkSettingsBySlug(slug: string): Promise<Record<string, unknown>> {
  const studioId = await getStudioIdBySlug(slug);
  if (!studioId) return {};
  return getVitrineLinkSettingsFromSupabase(studioId);
}

export async function saveVitrineLinkSettingsToSupabase(studioId: string, settings: Record<string, unknown>): Promise<void> {
  const { error } = await db.from('inkflow_vitrine_link_settings').upsert(
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
  const { error } = await db.from('inkflow_payment_settings').upsert(
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
  const { error } = await db.from('inkflow_care_templates').upsert(
    { studio_id: studioId, templates, updated_at: new Date().toISOString() },
    { onConflict: 'studio_id' }
  );
  if (error) throw error;
}

// Clients
export function mapClientFromDb(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    phone: (row.phone as string) || '',
    avatar: (row.avatar_url as string) || undefined,
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

/** Limite par défaut pour éviter surcharge mémoire (pagination à ajouter si > 500) */
const DEFAULT_LIST_LIMIT = 500;

export async function getClientsFromSupabase(studioId: string): Promise<Client[]> {
  const { data, error } = await supabase.from('inkflow_clients').select('*').eq('studio_id', studioId).order('updated_at', { ascending: false }).limit(DEFAULT_LIST_LIMIT);
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
    avatar_url: client.avatar || null,
    total_spent: client.totalSpent,
    appointments_count: client.appointmentsCount,
    last_visit: client.lastVisit || null,
    first_visit: client.firstVisit,
    status: client.status,
    tags: client.tags,
    tattoos: client.tattoos as unknown as import('../types/database').Json,
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

const CLIENT_BULK_INSERT_CHUNK = 80;

/** Insertion groupée (import CSV). Chunk pour limiter la taille des requêtes. */
export async function bulkInsertClientsToSupabase(studioId: string, clients: Client[]): Promise<void> {
  if (clients.length === 0) return;
  const now = new Date().toISOString();
  for (let i = 0; i < clients.length; i += CLIENT_BULK_INSERT_CHUNK) {
    const slice = clients.slice(i, i + CLIENT_BULK_INSERT_CHUNK);
    const rows = slice.map((c) => ({
      id: c.id,
      studio_id: studioId,
      name: c.name,
      email: c.email,
      phone: c.phone?.trim() ? c.phone.trim() : null,
      avatar_url: c.avatar ?? null,
      total_spent: c.totalSpent,
      appointments_count: c.appointmentsCount,
      last_visit: c.lastVisit ?? null,
      first_visit: c.firstVisit,
      status: c.status,
      tags: c.tags,
      tattoos: c.tattoos as unknown as import('../types/database').Json,
      notes: c.notes ?? null,
      updated_at: now,
    }));
    const { error } = await supabase.from('inkflow_clients').insert(rows);
    if (error) throw error;
  }
}

// Waitlist
export function mapWaitlistEntryFromDb(row: Record<string, unknown>): WaitlistEntry {
  return {
    id: row.id as string,
    studioId: row.studio_id as string,
    clientName: row.client_name as string,
    clientEmail: row.client_email as string,
    desiredService: (row.desired_service as string) || undefined,
    preferredDates: (row.preferred_dates as string) || undefined,
    notes: (row.notes as string) || undefined,
    status: (row.status as WaitlistEntry['status']) || 'waiting',
    notifiedAt: (row.notified_at as string) || undefined,
    createdAt: (row.created_at as string) || new Date().toISOString(),
  };
}

export async function getWaitlistFromSupabase(studioId: string): Promise<WaitlistEntry[]> {
  const { data, error } = await supabase
    .from('inkflow_waitlist')
    .select('*')
    .eq('studio_id', studioId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapWaitlistEntryFromDb);
}

export async function addWaitlistEntryToSupabase(studioId: string, entry: Omit<WaitlistEntry, 'id' | 'studioId' | 'createdAt'>): Promise<WaitlistEntry> {
  const id = `wl_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const now = new Date().toISOString();
  const row = {
    id,
    studio_id: studioId,
    client_name: entry.clientName,
    client_email: entry.clientEmail,
    desired_service: entry.desiredService || null,
    preferred_dates: entry.preferredDates || null,
    notes: entry.notes || null,
    status: entry.status || 'waiting',
    notified_at: null,
    created_at: now,
  };
  const { data, error } = await supabase.from('inkflow_waitlist').insert(row).select().single();
  if (error) throw error;
  return mapWaitlistEntryFromDb(data);
}

export async function updateWaitlistStatusInSupabase(
  id: string,
  updates: { status: 'notified' | 'booked'; notified_at?: string | null }
): Promise<void> {
  const payload: Record<string, unknown> = { status: updates.status };
  if (updates.notified_at !== undefined) payload.notified_at = updates.notified_at;
  const { error } = await supabase.from('inkflow_waitlist').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteWaitlistEntryFromSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('inkflow_waitlist').delete().eq('id', id);
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
export function mapAppointmentFromDb(row: Record<string, unknown>): Appointment {
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
    projectRequestId: (row.project_request_id as string) || null,
    createdAt: (row.created_at as string) || new Date().toISOString(),
    updatedAt: (row.updated_at as string) || new Date().toISOString()
  };
}

export async function getAppointmentsFromSupabase(studioId: string): Promise<Appointment[]> {
  const { data, error } = await supabase.from('inkflow_appointments').select('*').eq('studio_id', studioId).order('date', { ascending: true }).order('time', { ascending: true }).limit(DEFAULT_LIST_LIMIT);
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
    updated_at: new Date().toISOString(),
    project_request_id: apt.projectRequestId ?? null,
  };
  const { error } = await supabase.from('inkflow_appointments').upsert(row, { onConflict: 'id' });
  if (error) {
    if (error.code === '23505' && error.message?.includes('idx_appointments_slot_unique')) {
      throw new Error('Ce créneau vient juste d\'être pris par un autre client. Veuillez en choisir un autre.');
    }
    throw error;
  }
}

/**
 * RDV placeholder lié à une demande projet (messagerie / carte paiement) — réutilise la ligne existante si déjà créée.
 */
export async function ensurePlaceholderAppointmentForProject(
  studioId: string,
  pr: { id: string; clientName: string; clientEmail: string; description: string }
): Promise<string> {
  const { data: existing } = await supabase
    .from('inkflow_appointments')
    .select('id')
    .eq('studio_id', studioId)
    .eq('project_request_id', pr.id)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];
  const aptId = `apt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const serviceName = pr.description.length > 50 ? `${pr.description.slice(0, 47)}...` : pr.description;
  const apt: Appointment = {
    id: aptId,
    clientId: '',
    clientName: pr.clientName,
    clientEmail: pr.clientEmail,
    clientPhone: '',
    date: today,
    time: '10:00',
    service: `Projet - ${serviceName}`,
    duration: 60,
    price: 0,
    deposit: 0,
    depositPaid: false,
    status: 'pending',
    tattooType: 'custom',
    location: 'arm',
    size: 'medium',
    consentFormSigned: false,
    createdAt: now,
    updatedAt: now,
    projectRequestId: pr.id,
  };
  await saveAppointmentToSupabase(studioId, apt);
  return aptId;
}

export async function deleteAppointmentFromSupabase(aptId: string): Promise<void> {
  const { error } = await supabase.from('inkflow_appointments').delete().eq('id', aptId);
  if (error) throw error;
}

export async function markDepositAsPaid(aptId: string, studioId: string): Promise<void> {
  const { error } = await supabase
    .from('inkflow_appointments')
    .update({ 
      deposit_paid: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', aptId)
    .eq('studio_id', studioId);
  if (error) throw error;
}

// Flash designs
export function mapFlashFromDb(row: Record<string, unknown>): FlashDesign {
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
    createdAt: (row.created_at as string) || new Date().toISOString(),
    slug: (row.slug as string) || null,
    artistId: (row.artist_id as string) || null,
    featured: Boolean(row.featured),
    displayOrder: Number(row.display_order) || 0,
  };
}

export async function getFlashDesignsFromSupabase(studioId: string): Promise<FlashDesign[]> {
  const { data, error } = await supabase.from('inkflow_flash_designs').select('*').eq('studio_id', studioId).order('created_at', { ascending: false }).limit(DEFAULT_LIST_LIMIT);
  if (error) throw error;
  return (data || []).map(mapFlashFromDb);
}

export async function saveFlashDesignToSupabase(studioId: string, flash: FlashDesign): Promise<void> {
  const slug =
    flash.slug && String(flash.slug).trim() !== ''
      ? String(flash.slug).trim().toLowerCase()
      : buildFlashSlug(flash.title, flash.id);

  const row: Record<string, unknown> = {
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
    updated_at: new Date().toISOString(),
    slug,
    artist_id: flash.artistId ?? null,
    featured: flash.featured ?? false,
    display_order: flash.displayOrder ?? 0,
  };
  const { error } = await db.from('inkflow_flash_designs').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteFlashDesignFromSupabase(flashId: string): Promise<void> {
  const { error } = await supabase.from('inkflow_flash_designs').delete().eq('id', flashId);
  if (error) throw error;
}

// Notifications
export function mapNotificationFromDb(row: Record<string, unknown>): Notification {
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

/** JSONB / legacy : tableau d’URLs d’images de référence */
function parseProjectReferenceImages(row: Record<string, unknown>): string[] {
  const raw = row.reference_images;
  const single = row.reference_image_url;
  const fromJsonb = (): string[] => {
    if (Array.isArray(raw)) {
      return raw.map((x) => String(x)).filter((u) => u.length > 0 && /^https?:\/\//i.test(u));
    }
    if (typeof raw === 'string' && raw.trim()) {
      try {
        const p = JSON.parse(raw) as unknown;
        if (Array.isArray(p)) return p.map(String).filter((u) => u.length > 0 && /^https?:\/\//i.test(u));
      } catch {
        /* ignore */
      }
    }
    return [];
  };
  const urls = fromJsonb();
  if (urls.length > 0) return urls;
  if (typeof single === 'string' && single.trim() && /^https?:\/\//i.test(single.trim())) {
    return [single.trim()];
  }
  return [];
}

// Project requests (Demandes de projet)
export function mapProjectRequestFromDb(row: Record<string, unknown>): ProjectRequest {
  const referenceImages = parseProjectReferenceImages(row);
  return {
    id: row.id as string,
    studioId: row.studio_id as string,
    clientName: row.client_name as string,
    clientEmail: row.client_email as string,
    clientInstagram: row.client_instagram as string | undefined,
    description: row.description as string,
    projectType: (row.project_type as 'flash' | 'custom') || 'custom',
    placement: row.placement as string | undefined,
    estimatedSize: (row.estimated_size || row.size) as string | undefined,
    size: (row.size || row.estimated_size) as string | undefined,
    budget: row.budget as string | undefined,
    status: (row.status as ProjectRequestStatus) || 'pending',
    referenceImageUrl: referenceImages[0] ?? (row.reference_image_url as string | undefined),
    referenceImages,
    createdAt: (row.created_at as string) || new Date().toISOString()
  };
}

export async function getProjectRequestsFromSupabase(studioId: string): Promise<ProjectRequest[]> {
  const { data, error } = await supabase
    .from('inkflow_project_requests')
    .select('*')
    .eq('studio_id', studioId)
    .order('created_at', { ascending: false })
    .limit(DEFAULT_LIST_LIMIT);
  if (error) throw error;
  return (data || []).map(mapProjectRequestFromDb);
}

export async function updateProjectRequestStatus(
  id: string,
  status: ProjectRequestStatus,
  studioId: string
): Promise<void> {
  const { error } = await supabase
    .from('inkflow_project_requests')
    .update({ status })
    .eq('id', id)
    .eq('studio_id', studioId);
  if (error) throw error;
}

/** Préférences dashboard / modules (JSONB sur inkflow_studios) */
export async function getDashboardPreferencesFromSupabase(studioId: string): Promise<StudioDashboardPreferences> {
  const { data, error } = await supabase.from('inkflow_studios').select('dashboard_preferences').eq('id', studioId).maybeSingle();
  if (error || !data?.dashboard_preferences) {
    return { ...DEFAULT_STUDIO_DASHBOARD_PREFERENCES, schema_version: STUDIO_PREFERENCES_SCHEMA_VERSION };
  }
  const raw = data.dashboard_preferences as Record<string, unknown>;
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_STUDIO_DASHBOARD_PREFERENCES, schema_version: STUDIO_PREFERENCES_SCHEMA_VERSION };
  }
  return {
    ...DEFAULT_STUDIO_DASHBOARD_PREFERENCES,
    ...raw,
    schema_version: STUDIO_PREFERENCES_SCHEMA_VERSION,
  } as StudioDashboardPreferences;
}

export async function saveDashboardPreferencesToSupabase(studioId: string, prefs: StudioDashboardPreferences): Promise<void> {
  const { error } = await db
    .from('inkflow_studios')
    .update({
      dashboard_preferences: prefs,
      updated_at: new Date().toISOString(),
    })
    .eq('id', studioId);
  if (error) throw error;
}

/** Config programme points (LoyaltyManager) — aligné sur les défauts du composant */
export const DEFAULT_POINTS_LOYALTY_SETTINGS: LoyaltySettings = {
  enabled: true,
  pointsPerEuro: 1,
  referralBonus: 50,
  tierThresholds: { silver: 200, gold: 500, platinum: 1000 },
  rewards: [
    { name: '10% sur prochain tattoo', cost: 100 },
    { name: 'Retouche gratuite', cost: 200 },
    { name: 'Flash offert', cost: 500 },
  ],
};

const LOYALTY_TIERS: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum'];

function normalizeLoyaltyTier(value: string | null | undefined): LoyaltyTier {
  if (value && LOYALTY_TIERS.includes(value as LoyaltyTier)) return value as LoyaltyTier;
  return 'bronze';
}

function mapLoyaltyRowToEntry(row: {
  id: string;
  studio_id: string;
  client_id: string;
  points: number | null;
  tier: string | null;
  referral_code: string | null;
  total_earned: number | null;
  total_redeemed: number | null;
  created_at: string | null;
}): LoyaltyEntry {
  return {
    id: row.id,
    studioId: row.studio_id,
    clientId: row.client_id,
    points: row.points ?? 0,
    tier: normalizeLoyaltyTier(row.tier),
    referralCode: row.referral_code ?? undefined,
    totalEarned: row.total_earned ?? 0,
    totalRedeemed: row.total_redeemed ?? 0,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export async function fetchLoyaltyEntriesFromSupabase(studioId: string): Promise<LoyaltyEntry[]> {
  const { data, error } = await supabase
    .from('inkflow_loyalty')
    .select('*')
    .eq('studio_id', studioId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((row) => mapLoyaltyRowToEntry(row as Parameters<typeof mapLoyaltyRowToEntry>[0]));
}

export async function fetchPointsLoyaltySettingsFromSupabase(studioId: string): Promise<LoyaltySettings> {
  const { data, error } = await supabase
    .from('inkflow_studios')
    .select('*')
    .eq('id', studioId)
    .maybeSingle();
  if (error) throw error;
  const raw = data?.points_loyalty_settings;
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_POINTS_LOYALTY_SETTINGS };
  }
  const o = raw as Record<string, unknown>;
  const th = o.tierThresholds;
  const tierThresholds =
    th && typeof th === 'object'
      ? {
          ...DEFAULT_POINTS_LOYALTY_SETTINGS.tierThresholds,
          ...(th as LoyaltySettings['tierThresholds']),
        }
      : DEFAULT_POINTS_LOYALTY_SETTINGS.tierThresholds;
  return {
    ...DEFAULT_POINTS_LOYALTY_SETTINGS,
    enabled: typeof o.enabled === 'boolean' ? o.enabled : DEFAULT_POINTS_LOYALTY_SETTINGS.enabled,
    pointsPerEuro: typeof o.pointsPerEuro === 'number' ? o.pointsPerEuro : DEFAULT_POINTS_LOYALTY_SETTINGS.pointsPerEuro,
    referralBonus: typeof o.referralBonus === 'number' ? o.referralBonus : DEFAULT_POINTS_LOYALTY_SETTINGS.referralBonus,
    tierThresholds,
    rewards: Array.isArray(o.rewards) ? (o.rewards as LoyaltySettings['rewards']) : DEFAULT_POINTS_LOYALTY_SETTINGS.rewards,
  };
}

export async function savePointsLoyaltySettingsToSupabase(studioId: string, settings: LoyaltySettings): Promise<void> {
  const { error } = await supabase
    .from('inkflow_studios')
    .update({
      points_loyalty_settings: settings as unknown as import('../types/database').Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', studioId);
  if (error) throw error;
}

/**
 * Remplace toutes les lignes `inkflow_loyalty` du studio (MVP : peu de lignes).
 * Respecte la contrainte FK sur `client_id` : les entrées orphelines échoueront côté insert.
 */
export async function syncLoyaltyEntriesToSupabase(studioId: string, entries: LoyaltyEntry[]): Promise<void> {
  const now = new Date().toISOString();
  const rows = entries.map((e) => ({
    id: e.id,
    studio_id: studioId,
    client_id: e.clientId,
    points: e.points,
    tier: e.tier,
    referral_code: e.referralCode ?? null,
    total_earned: e.totalEarned,
    total_redeemed: e.totalRedeemed,
    created_at: e.createdAt || now,
    updated_at: now,
  }));
  const { error: delErr } = await supabase.from('inkflow_loyalty').delete().eq('studio_id', studioId);
  if (delErr) throw delErr;
  if (rows.length === 0) return;
  const { error: insErr } = await supabase.from('inkflow_loyalty').insert(rows);
  if (insErr) throw insErr;
}

export { getStudioId };
