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
    saveVitrineDataToSupabase(studioId, data).catch(console.error);
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
    console.error('getVitrineDataAsync:', e);
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

/** Charge les données vitrine par slug depuis Supabase (page publique sans auth) */
export async function getVitrineDataBySlugAsync(slug: string): Promise<VitrineData> {
  const defaultData = defaultVitrineData(slug);
  if (!useSupabase()) return getVitrineData(slug);
  try {
    const fromDb = await getVitrineDataBySlugFromSupabase(slug, defaultData);
    const key = `${STORAGE_PREFIX}${slug}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify({ ...fromDb, slug }));
    }
    return fromDb;
  } catch (e) {
    console.error('getVitrineDataBySlugAsync:', e);
    return getVitrineData(slug);
  }
}
