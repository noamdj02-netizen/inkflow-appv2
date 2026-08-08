import { getWidgetOrderFromSupabase, saveWidgetOrderToSupabase } from './supabaseDashboard';

/**
 * Persistance de l'ordre des widgets du dashboard Vue d'ensemble.
 * localStorage + sync Supabase quand studioId disponible.
 */

const STORAGE_KEY = 'inkflow-dashboard-widget-order';
const LAYOUT_STORAGE_KEY = 'inkflow-dashboard-layout';

/** IDs des widgets KPI */
export const KPI_WIDGET_IDS = [
  'kpi-revenue',
  'kpi-deposits',
  'kpi-clients',
  'kpi-appointments',
] as const;

/** IDs des widgets principaux (main content area) */
export const MAIN_WIDGET_IDS = [
  'revenue-chart',
  'appointments-list',
  'clients-deposits',
  'requests-pending',
] as const;

/** Widgets retirés du produit — filés des layouts persistés (localStorage / ordre plat API) */
const REMOVED_WIDGET_IDS = new Set<string>(['next-client']);

/** IDs obsolètes → nouveaux (migration) */
const LEGACY_WIDGET_MAP: Record<string, string> = {
  'clients-recent': 'clients-deposits',
  'deposits-recent': 'clients-deposits',
};

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
  leftColumn: ['revenue-chart', 'appointments-list'],
  rightColumn: ['clients-deposits', 'requests-pending'],
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

function migrateLayoutIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    const migrated = LEGACY_WIDGET_MAP[id] ?? id;
    if (REMOVED_WIDGET_IDS.has(migrated)) continue;
    if (!seen.has(migrated)) {
      seen.add(migrated);
      result.push(migrated);
    }
  }
  return result;
}

export function getLayoutFromStorage(): DashboardLayout {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LAYOUT };
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_LAYOUT };
    const layout = parsed as DashboardLayout;
    if (
      !Array.isArray(layout.leftColumn) ||
      !Array.isArray(layout.rightColumn) ||
      !Array.isArray(layout.kpiOrder)
    ) {
      return { ...DEFAULT_LAYOUT };
    }
    const migrated: DashboardLayout = {
      kpiOrder: migrateLayoutIds(layout.kpiOrder),
      leftColumn: migrateLayoutIds(layout.leftColumn),
      rightColumn: migrateLayoutIds(layout.rightColumn),
    };
    const hadEmpty =
      migrated.kpiOrder.length === 0 ||
      migrated.leftColumn.length === 0 ||
      migrated.rightColumn.length === 0;
    if (migrated.kpiOrder.length === 0) migrated.kpiOrder = [...KPI_WIDGET_IDS];
    if (migrated.leftColumn.length === 0) migrated.leftColumn = [...DEFAULT_LAYOUT.leftColumn];
    if (migrated.rightColumn.length === 0) migrated.rightColumn = [...DEFAULT_LAYOUT.rightColumn];
    const flatIds = [...layout.kpiOrder, ...layout.leftColumn, ...layout.rightColumn];
    const hadLegacyIds = flatIds.some((id) => LEGACY_WIDGET_MAP[id]);
    const hadRemovedIds = flatIds.some((id) => REMOVED_WIDGET_IDS.has(LEGACY_WIDGET_MAP[id] ?? id));
    if (hadLegacyIds || hadEmpty || hadRemovedIds) setLayoutToStorage(migrated);
    return migrated;
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
export async function getWidgetOrder(
  studioId: string | null,
  useSupabase: boolean
): Promise<string[]> {
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
export async function syncLayoutToApi(
  studioId: string | null,
  layout: DashboardLayout
): Promise<void> {
  setLayoutToStorage(layout);
  if (studioId) {
    try {
      await saveWidgetOrderToSupabase(studioId, [
        ...layout.kpiOrder,
        ...layout.leftColumn,
        ...layout.rightColumn,
      ]);
    } catch {
      // ignore
    }
  }
}
