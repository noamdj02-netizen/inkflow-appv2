/**
 * Persistance de l'ordre des widgets du dashboard Vue d'ensemble.
 * localStorage pour l'instant, prêt pour sync API future.
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

/** TODO: sync vers API/base de données */
export async function syncWidgetOrderToApi(studioId: string, order: string[]): Promise<void> {
  // À implémenter plus tard : envoyer order à l'API
  await Promise.resolve();
  void studioId;
  void order;
}
