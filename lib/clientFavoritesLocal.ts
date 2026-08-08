/**
 * Favoris flashs / studios côté client (localStorage — offline-first, sync Supabase si connecté).
 */
const STORAGE_KEY = 'inkflow_client_favorite_flash_ids_v1';
const STORAGE_KEY_STUDIOS = 'inkflow_client_favorite_studio_ids_v1';

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

/** Fusionne les IDs distants dans le stockage local (union). Retourne true si le set a changé. */
export function mergeFavoriteFlashIdsFromRemote(remoteIds: Iterable<string>): boolean {
  const s = getFavoriteFlashIds();
  let changed = false;
  for (const id of remoteIds) {
    if (id && !s.has(id)) {
      s.add(id);
      changed = true;
    }
  }
  if (changed) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]));
  }
  return changed;
}

function parseStudioIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDIOS);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string' && x.length > 0) : [];
  } catch {
    return [];
  }
}

export function getFavoriteStudioIds(): Set<string> {
  return new Set(parseStudioIds());
}

export function isFavoriteStudioId(id: string): boolean {
  return getFavoriteStudioIds().has(id);
}

/** Retourne le nouvel état favori (true = ajouté). */
export function toggleFavoriteStudioId(id: string): boolean {
  const s = getFavoriteStudioIds();
  const was = s.has(id);
  if (was) s.delete(id);
  else s.add(id);
  localStorage.setItem(STORAGE_KEY_STUDIOS, JSON.stringify([...s]));
  return !was;
}

export function mergeFavoriteStudioIdsFromRemote(remoteIds: Iterable<string>): boolean {
  const s = getFavoriteStudioIds();
  let changed = false;
  for (const id of remoteIds) {
    if (id && !s.has(id)) {
      s.add(id);
      changed = true;
    }
  }
  if (changed) {
    localStorage.setItem(STORAGE_KEY_STUDIOS, JSON.stringify([...s]));
  }
  return changed;
}
