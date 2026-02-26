import type { VitrineData } from '../types/vitrine';
import { defaultVitrineData } from './vitrineStorageDefault';
import { getVitrineDataFromSupabase, saveVitrineDataToSupabase, getVitrineDataBySlugFromSupabase, ensureStudio, getStudioId } from './supabaseDashboard';

const STORAGE_PREFIX = 'inkflow-vitrine-';

export function getVitrineSlug(studioName: string): string {
  return (studioName || 'mon-studio')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-') || 'mon-studio';
}

function useSupabase(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key && url.length > 10);
}

export function getVitrineData(slug: string, userEmail?: string, studioName?: string): VitrineData {
  const defaultData = defaultVitrineData(slug);
  if (typeof window === 'undefined') return defaultData;
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${slug}`);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<VitrineData>;
      return { ...defaultData, ...parsed, slug };
    }
  } catch {}
  return defaultData;
}

export function setVitrineData(slug: string, data: VitrineData, userEmail?: string, studioName?: string): void {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_PREFIX}${slug}`;
  localStorage.setItem(key, JSON.stringify({ ...data, slug }));
  if (useSupabase() && userEmail && studioName) {
    const studioId = getStudioId(userEmail, studioName);
    saveVitrineDataToSupabase(studioId, data).catch(() => {});
  }
}

export async function getVitrineDataAsync(slug: string, userEmail: string, studioName: string): Promise<VitrineData> {
  const defaultData = defaultVitrineData(slug);
  if (!useSupabase()) return getVitrineData(slug);
  try {
    await ensureStudio(userEmail, 'User', studioName);
    const studioId = getStudioId(userEmail, studioName);
    const fromDb = await getVitrineDataFromSupabase(studioId, defaultData);
    const key = `${STORAGE_PREFIX}${slug}`;
    localStorage.setItem(key, JSON.stringify({ ...fromDb, slug }));
    return fromDb;
  } catch (e) {
    if (import.meta.env.DEV) console.error('getVitrineDataAsync:', e);
    return getVitrineData(slug);
  }
}

export async function saveVitrineDataAsync(slug: string, data: VitrineData, userEmail: string, studioName: string): Promise<void> {
  setVitrineData(slug, data, userEmail, studioName);
  if (useSupabase()) {
    const studioId = getStudioId(userEmail, studioName);
    await saveVitrineDataToSupabase(studioId, data);
  }
}

/** Charge les données vitrine par slug depuis Supabase (page publique sans auth). Si le même navigateur a des données en localStorage pour ce slug, on les utilise pour afficher les dernières modifs (ex. après un échec de sync). */
export async function getVitrineDataBySlugAsync(slug: string): Promise<VitrineData> {
  const defaultData = defaultVitrineData(slug);
  const key = `${STORAGE_PREFIX}${slug}`;
  const localRaw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  if (!useSupabase()) {
    if (localRaw) {
      try {
        return { ...defaultData, ...(JSON.parse(localRaw) as object), slug } as VitrineData;
      } catch {
        return defaultData;
      }
    }
    return defaultData;
  }
  try {
    const fromDb = await getVitrineDataBySlugFromSupabase(slug, defaultData);
    // Ne pas écraser le localStorage s'il contient déjà des données (draft local après échec sync)
    if (typeof window !== 'undefined' && !localRaw) {
      localStorage.setItem(key, JSON.stringify({ ...fromDb, slug }));
    }
    // Préférer le draft local (même navigateur) pour que les photos modifiées s'affichent après un échec de sync
    if (localRaw) {
      try {
        return { ...defaultData, ...(JSON.parse(localRaw) as object), slug } as VitrineData;
      } catch {
        return fromDb;
      }
    }
    return fromDb;
  } catch (e) {
    if (localRaw) {
      try {
        return { ...defaultData, ...(JSON.parse(localRaw) as object), slug } as VitrineData;
      } catch {
        return defaultData;
      }
    }
    return defaultData;
  }
}
