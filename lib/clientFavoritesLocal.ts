/**
 * Favoris flashs côté client (localStorage — MVP avant table Supabase dédiée).
 */
const STORAGE_KEY = 'inkflow_client_favorite_flash_ids_v1';

function parseIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string' && x.length > 0) : [];
  } catch {
    return [];
  }
}

export function getFavoriteFlashIds(): Set<string> {
  return new Set(parseIds());
}

export function isFavoriteFlashId(id: string): boolean {
  return getFavoriteFlashIds().has(id);
}

/** Retourne le nouvel état favori (true = ajouté). */
export function toggleFavoriteFlashId(id: string): boolean {
  const s = getFavoriteFlashIds();
  const was = s.has(id);
  if (was) s.delete(id);
  else s.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]));
  return !was;
}
