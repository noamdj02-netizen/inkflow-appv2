import { supabase } from './supabase';
import type { ArtistAccount } from '../types';

function parsePermissions(raw: unknown): Record<string, boolean> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    const out: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(o)) {
      out[k] = Boolean(v);
    }
    return out;
  }
  return {};
}

function parseSpecialties(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((x) => String(x)).filter(Boolean);
  return [];
}

export function mapArtistAccountRow(row: Record<string, unknown>): ArtistAccount {
  return {
    id: String(row.id ?? ''),
    studioId: String(row.studio_id ?? ''),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    role: String(row.role ?? 'artist'),
    avatar: typeof row.avatar === 'string' ? row.avatar : undefined,
    specialties: parseSpecialties(row.specialties),
    permissions: parsePermissions(row.permissions),
    active: row.active !== false,
    createdAt: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  };
}

export async function fetchArtistAccountsForStudio(studioId: string): Promise<ArtistAccount[]> {
  if (!studioId) return [];

  const { data, error } = await supabase
    .from('inkflow_artist_accounts')
    .select('id,studio_id,name,email,role,avatar,specialties,permissions,active,created_at')
    .eq('studio_id', studioId)
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('[inkflowArtistAccountsDb] fetch', error.message);
    return [];
  }

  return (data ?? []).map((r) => mapArtistAccountRow(r as Record<string, unknown>));
}

/**
 * Synchronise les fiches équipe + permissions vers inkflow_artist_accounts (source de vérité cloud).
 * Préserve auth_user_id pour les lignes existantes.
 */
export async function upsertArtistAccountsToSupabase(
  studioId: string,
  artists: ArtistAccount[]
): Promise<void> {
  if (!studioId || artists.length === 0) return;

  const { data: existing } = await supabase
    .from('inkflow_artist_accounts')
    .select('id, auth_user_id')
    .eq('studio_id', studioId);

  const authById = new Map<string, string | null>(
    (existing ?? []).map((r: { id: string; auth_user_id: string | null }) => [r.id, r.auth_user_id])
  );

  const now = new Date().toISOString();
  const rows = artists.map((a) => ({
    id: a.id,
    studio_id: studioId,
    name: a.name.trim(),
    email: a.email.trim().toLowerCase(),
    role: a.role || 'artist',
    avatar: a.avatar ?? null,
    specialties: a.specialties ?? [],
    permissions: a.permissions ?? {},
    active: a.active !== false,
    updated_at: now,
    auth_user_id: authById.get(a.id) ?? null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('inkflow_artist_accounts').upsert(rows, {
    onConflict: 'id',
  });

  if (error) throw new Error(error.message);
}
