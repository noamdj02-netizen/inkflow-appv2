import { supabase } from './supabase';
import type { ArtistAccount } from '../types';

/** Slug URL stable dérivé de l’id (ne change pas si le nom change). */
export function artistPublicSlug(artistId: string): string {
  const clean = artistId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const suffix = clean.slice(-16) || clean || 'x';
  return `artist-${suffix}`;
}

/** Pousse les comptes tatoueurs du dashboard vers inkflow_artists (app client + /artist/[slug]). Préserve bio / dispo / Insta existants. */
export async function syncArtistAccountsToSupabase(studioId: string, artists: ArtistAccount[]): Promise<void> {
  if (!studioId || artists.length === 0) return;

  const { data: existingRows } = await supabase.from('inkflow_artists').select('*').eq('studio_id', studioId);
  const byId = new Map((existingRows ?? []).map((r: Record<string, unknown>) => [r.id as string, r]));

  const rows = artists.map((a) => {
    const ex = byId.get(a.id) as Record<string, unknown> | undefined;
    return {
      id: a.id,
      studio_id: studioId,
      name: a.name,
      slug: (ex?.slug as string) || artistPublicSlug(a.id),
      bio: (ex?.bio as string | null) ?? null,
      avatar_url: a.avatar ?? (ex?.avatar_url as string | null) ?? null,
      location_lat: ex?.location_lat ?? null,
      location_lng: ex?.location_lng ?? null,
      styles: a.specialties ?? [],
      years_exp: (ex?.years_exp as number) ?? 0,
      rating: (ex?.rating as number) ?? 5.0,
      tattoos_count: (ex?.tattoos_count as number) ?? 0,
      is_active: a.active,
      available_now: (ex?.available_now as boolean) ?? false,
      instagram_url: (ex?.instagram_url as string | null) ?? null,
      service_radius_km: (ex?.service_radius_km as number) ?? 25,
      updated_at: new Date().toISOString(),
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('inkflow_artists').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

export interface InkflowArtistPublicRow {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  available_now: boolean;
  instagram_url: string | null;
  styles: string[];
  is_active: boolean;
}

export async function fetchInkflowArtistsForStudio(studioId: string): Promise<InkflowArtistPublicRow[]> {
  const { data, error } = await supabase
    .from('inkflow_artists')
    .select('id, name, slug, bio, avatar_url, available_now, instagram_url, styles, is_active')
    .eq('studio_id', studioId)
    .order('name', { ascending: true });

  if (error) {
    console.warn('[fetchInkflowArtistsForStudio]', error.message);
    return [];
  }

  return (data ?? []) as InkflowArtistPublicRow[];
}

export async function updateInkflowArtistPublicFields(
  artistId: string,
  patch: Partial<Pick<InkflowArtistPublicRow, 'bio' | 'available_now' | 'instagram_url'>>
): Promise<void> {
  const { error } = await supabase
    .from('inkflow_artists')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', artistId);

  if (error) throw error;
}
