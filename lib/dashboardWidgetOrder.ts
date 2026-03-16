import { getWidgetOrderFromSupabase, saveWidgetOrderToSupabase } from './supabaseDashboard';

/**
 * Persistance de l'ordre des widgets du dashboard Vue d'ensemble.
 * localStorage + sync Supabase quand studioId disponible.
 */

const STORAGE_KEY = 'inkflow-dashboard-widget-order';
const LAYOUT_STORAGE_KEY = 'inkflow-dashboard-layout';

/** IDs des widgets KPI */
export const KPI_WIDGET_IDS = ['kpi-revenue', 'kpi-deposits', 'kpi-clients', 'kpi-appointments'] as const;

/** IDs des widgets principaux (main content area) */
export const MAIN_WIDGET_IDS = [
  'revenue-chart',
  'appointments-list', 
  'clients-recent',
  'deposits-recent',
  'requests-pending',
  'next-client',
  // 'referral-widget', // V2: Masqué pour le MVP
] as const;

/** Tous les IDs de widgets fixes */
export const FIXED_WIDGET_IDS = [...KPI_WIDGET_IDS] as const;

/** Ordre par défaut des widgets principaux */
export const DEFAULT_MAIN_ORDER: string[] = [...MAIN_WIDGET_IDS];

/** Layout par défaut - colonnes gauche/droite */
export interface DashboardLayout {
  leftColumn: string[];
  rightColumn: string[];
  kpiOrder: string[];
}

export const DEFAULT_LAYOUT: DashboardLayout = {
  leftColumn: ['revenue-chart', 'appointments-list'], // V2: referral-widget retiré pour MVP
  rightColumn: ['clients-recent', 'deposits-recent', 'requests-pending', 'next-client'],
  kpiOrder: [...KPI_WIDGET_IDS],
};

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

export function getLayoutFromStorage(): DashboardLayout {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LAYOUT };
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_LAYOUT };
    const layout = parsed as DashboardLayout;
    if (!Array.isArray(layout.leftColumn) || !Array.isArray(layout.rightColumn) || !Array.isArray(layout.kpiOrder)) {
      return { ...DEFAULT_LAYOUT };
    }
    return layout;
  } catch {
    return { ...DEFAULT_LAYOUT };
  }
}

export function setLayoutToStorage(layout: DashboardLayout): void {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
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

/** Sync layout vers Supabase et localStorage */
export async function syncLayoutToApi(studioId: string | null, layout: DashboardLayout): Promise<void> {
  setLayoutToStorage(layout);
  if (studioId) {
    try {
      await saveWidgetOrderToSupabase(studioId, [...layout.kpiOrder, ...layout.leftColumn, ...layout.rightColumn]);
    } catch {
      // ignore
    }
  }
}
