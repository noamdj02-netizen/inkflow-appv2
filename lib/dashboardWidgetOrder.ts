import { getWidgetOrderFromSupabase, saveWidgetOrderToSupabase } from './supabaseDashboard';

/**
 * Persistance de l'ordre des widgets du dashboard Vue d'ensemble.
 * localStorage + sync Supabase quand studioId disponible.
 */

const STORAGE_KEY = 'inkflow-dashboard-widget-order';

/** IDs des widgets fixes (KPI) — ordre par défaut : Demandes, RDV, Acomptes, Revenus */
export const FIXED_WIDGET_IDS = ['kpi-demands', 'kpi-rdv', 'kpi-deposits', 'kpi-revenue'] as const;

/** Ordre par défaut */
const DEFAULT_ORDER: string[] = [...FIXED_WIDGET_IDS];

export function getWidgetOrderFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_ORDER];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_ORDER];
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [...DEFAULT_ORDER];
  }
}

export function setWidgetOrderToStorage(order: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    // ignore
  }
}

/** Récupère l'ordre depuis Supabase (si useSupabase) ou localStorage */
export async function getWidgetOrder(studioId: string | null, useSupabase: boolean): Promise<string[]> {
  if (studioId && useSupabase) {
    try {
      const fromApi = await getWidgetOrderFromSupabase(studioId);
      if (fromApi.length > 0) return fromApi;
    } catch {
      // fallback to localStorage
    }
  }
  return getWidgetOrderFromStorage();
}

/** Sync vers Supabase (si studioId) et localStorage */
export async function syncWidgetOrderToApi(studioId: string, order: string[]): Promise<void> {
  setWidgetOrderToStorage(order);
  if (studioId) {
    try {
      await saveWidgetOrderToSupabase(studioId, order);
    } catch {
      // ignore — localStorage reste en fallback
    }
  }
}
