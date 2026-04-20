/**
 * Artistes publics (inkflow_artists) pour le tunnel /book — RLS artists_public_read.
 */
import { supabase } from './supabase';

export interface PublicBookingArtist {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
}

/** Pour éviter d’afficher plusieurs cartes si le même tatoueur a été créé plusieurs fois (tests, bugs). */
function normalizeArtistDisplayName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function firstNameToken(name: string): string {
  return (name.trim().toLowerCase().split(/\s+/)[0] ?? '').normalize('NFD').replace(/\p{M}/gu, '');
}

/**
 * Un seul profil par prénom : garde le nom le plus court (ex. « Noam » plutôt que « Noam Noam », « Noam hariau »).
 * Si deux personnes partagent le même prénom, fusionner côté base ou renommer en base.
 */
function onePrincipalPerFirstName(rows: RawArtistRow[]): RawArtistRow[] {
  const groups = new Map<string, RawArtistRow[]>();
  for (const r of rows) {
    const key = firstNameToken(r.name);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }
  const out: RawArtistRow[] = [];
  for (const [, list] of groups) {
    if (list.length === 1) {
      out.push(list[0]);
      continue;
    }
    list.sort((a, b) => {
      const la = a.name.trim().length;
      const lb = b.name.trim().length;
      if (la !== lb) return la - lb;
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return ta - tb;
    });
    out.push(list[0]);
  }
  return out;
}

type RawArtistRow = {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  created_at: string | null;
};

function dedupeArtistsByDisplayName<T extends { name: string; created_at: string | null }>(rows: T[]): T[] {
  const sorted = [...rows].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return ta - tb;
  });
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of sorted) {
    const key = normalizeArtistDisplayName(r.name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

async function fetchInkflowArtistRows(studioId: string): Promise<RawArtistRow[]> {
  const { data, error } = await supabase
    .from('inkflow_artists')
    .select('id, name, slug, avatar_url, created_at')
    .eq('studio_id', studioId)
    .eq('is_active', true);

  if (error || !data?.length) return [];

  const rows: RawArtistRow[] = data.map((r) => ({
    id: r.id as string,
    name: String(r.name || '').trim() || 'Artiste',
    slug: String(r.slug || '').trim().toLowerCase(),
    avatar_url: (r.avatar_url as string | null) ?? null,
    created_at: (r.created_at as string | null) ?? null,
  }));

  const deduped = dedupeArtistsByDisplayName(rows);
  const principals = onePrincipalPerFirstName(deduped);
  principals.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  return principals;
}

/**
 * Liste les tatoueurs actifs du studio. Utilisé pour l’étape « avec qui ? »
 * lorsqu’il y a au moins 2 artistes (forfait multi-artistes / collaborateurs).
 */
export async function fetchPublicArtistsForStudio(studioId: string): Promise<PublicBookingArtist[]> {
  const rows = await fetchInkflowArtistRows(studioId);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    avatar_url: r.avatar_url,
  }));
}
