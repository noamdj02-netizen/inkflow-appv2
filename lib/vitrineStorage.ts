import type { VitrineData } from '../types/vitrine';
import { defaultVitrineData } from './vitrineStorageDefault';
import {
  getVitrineDataFromSupabase,
  saveVitrineDataToSupabase,
  getVitrineDataBySlugFromSupabase,
  ensureStudio,
  getStudioByEmail,
  normalizePublicStudioSlug,
} from './supabaseDashboard';

/** ID studio en base = celui lié à l’email (inchangé si le nom du studio change). */
async function resolveStudioIdForVitrine(userEmail: string, studioName: string): Promise<string> {
  const existing = await getStudioByEmail(userEmail);
  if (existing?.id) return existing.id;
  const ensured = await ensureStudio(userEmail, 'User', studioName);
  return ensured.studioId;
}

const STORAGE_PREFIX = 'inkflow-vitrine-';

export function getVitrineSlug(studioName: string): string {
  return (
    (studioName || 'mon-studio')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-') || 'mon-studio'
  );
}

function isSupabaseEnvConfigured(): boolean {
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

/** Persistance locale uniquement. La sync Supabase passe par `saveVitrineDataAsync` (résout le bon `studio_id`). */
export function setVitrineData(
  slug: string,
  data: VitrineData,
  _userEmail?: string,
  _studioName?: string
): void {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_PREFIX}${slug}`;
  localStorage.setItem(key, JSON.stringify({ ...data, slug }));
}

export async function getVitrineDataAsync(
  slug: string,
  userEmail: string,
  studioName: string
): Promise<VitrineData> {
  const slugNorm = normalizePublicStudioSlug(slug);
  const defaultData = defaultVitrineData(slugNorm);
  if (!isSupabaseEnvConfigured()) return getVitrineData(slugNorm);
  try {
    const studioId = await resolveStudioIdForVitrine(userEmail, studioName);
    const fromDb = await getVitrineDataFromSupabase(studioId, defaultData);
    const key = `${STORAGE_PREFIX}${slugNorm}`;
    const merged = { ...fromDb, slug: slugNorm };
    localStorage.setItem(key, JSON.stringify(merged));
    return merged;
  } catch (e) {
    if (import.meta.env.DEV) console.error('getVitrineDataAsync:', e);
    return getVitrineData(slugNorm);
  }
}

export async function saveVitrineDataAsync(
  slug: string,
  data: VitrineData,
  userEmail: string,
  studioName: string
): Promise<void> {
  const slugNorm = normalizePublicStudioSlug(slug);
  const payload = { ...data, slug: slugNorm };
  setVitrineData(slugNorm, payload, userEmail, studioName);
  if (isSupabaseEnvConfigured()) {
    const studioId = await resolveStudioIdForVitrine(userEmail, studioName);
    await saveVitrineDataToSupabase(studioId, payload);
  }
}

/** Charge les données vitrine par slug depuis Supabase (page publique sans auth). Si le même navigateur a des données en localStorage pour ce slug, on les utilise pour afficher les dernières modifs (ex. après un échec de sync). */
export async function getVitrineDataBySlugAsync(slug: string): Promise<VitrineData> {
  // Vitrine démo : données fraîches ; ?theme=dark|neon|vintage permet de tester les thèmes
  if (slug === 'demo') {
    const data = defaultVitrineData(slug);
    if (typeof window !== 'undefined') {
      const theme = new URLSearchParams(window.location.search).get('theme');
      if (theme && ['dark', 'neon', 'vintage', 'light'].includes(theme)) {
        return { ...data, theme };
      }
    }
    return data;
  }
  const normalized = normalizePublicStudioSlug(slug);
  const defaultData = defaultVitrineData(normalized);
  const key = `${STORAGE_PREFIX}${normalized}`;
  const localRaw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  if (!isSupabaseEnvConfigured()) {
    if (localRaw) {
      try {
        return {
          ...defaultData,
          ...(JSON.parse(localRaw) as object),
          slug: normalized,
        } as VitrineData;
      } catch {
        return defaultData;
      }
    }
    return defaultData;
  }
  try {
    const fromDb = await getVitrineDataBySlugFromSupabase(normalized, defaultData);
    // Ne pas écraser le localStorage s'il contient déjà des données (draft local après échec sync)
    if (typeof window !== 'undefined' && !localRaw) {
      localStorage.setItem(key, JSON.stringify({ ...fromDb, slug: normalized }));
    }
    // Brouillon local : cette page est la vitrine **publique** — le serveur fait foi pour le texte / sections.
    // (Ancien ordre ...fromDb, ...localData écrasait le contenu Supabase avec un vieux template en localStorage.)
    if (localRaw) {
      try {
        const localParsed = JSON.parse(localRaw) as Partial<VitrineData>;
        const localData = { ...defaultData, ...localParsed, slug: normalized } as VitrineData;
        const pickUrl = (localVal: string | undefined, remoteVal: string) => {
          const l = (typeof localVal === 'string' ? localVal : '').trim();
          const r = (remoteVal || '').trim();
          return l || r;
        };
        const merged: VitrineData = {
          ...localData,
          ...fromDb,
          slug: normalized,
          theme: fromDb.theme ?? localData.theme,
          coverImage: pickUrl(localData.coverImage, fromDb.coverImage),
          avatar: pickUrl(localData.avatar, fromDb.avatar),
        };
        // Réaligner le cache navigateur sur la vérité serveur pour les prochains chargements
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(key, JSON.stringify(merged));
          } catch {
            /* quota / mode privé */
          }
        }
        return merged;
      } catch {
        return fromDb;
      }
    }
    return fromDb;
  } catch (e) {
    if (localRaw) {
      try {
        return {
          ...defaultData,
          ...(JSON.parse(localRaw) as object),
          slug: normalized,
        } as VitrineData;
      } catch {
        return defaultData;
      }
    }
    return defaultData;
  }
}
