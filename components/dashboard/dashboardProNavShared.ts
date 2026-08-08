/** Navigation dashboard Pro — types et styles sidebar partagés. */

export type DashboardTabId =
  | 'overview'
  | 'analytics'
  | 'requests'
  | 'stock'
  | 'agenda'
  | 'appointments'
  | 'flash'
  | 'clients'
  | 'finance'
  | 'messaging'
  | 'portfolio'
  | 'settings'
  | 'notifications'
  | 'account'
  | 'etablissement';

export type DashboardSettingsTabId =
  | 'home'
  | 'general'
  | 'modules'
  | 'payments'
  | 'finance_display'
  | 'billing'
  | 'care'
  | 'consent'
  | 'availability'
  | 'calendar'
  | 'vitrine'
  | 'waitlist'
  | 'loyalty'
  | 'messagerie'
  | 'account'
  | 'etablissement';

export type DashboardRequestsSubTab = 'inbox' | 'history';
export type DashboardPlanningView = 'week' | 'month';
export type DashboardFinanceView = 'revenus' | 'acomptes' | 'pilotage';
export type DashboardClientsView = 'overview' | 'projects' | 'loyalty';

export type DashboardExpandedMenus = {
  finance: boolean;
  planning: boolean;
  requests: boolean;
  clients: boolean;
  vitrine: boolean;
  settings: boolean;
};

/** Lignes de nav principale — bordure gauche primary (preset b0) à l'état actif */
export const SIDEBAR_NAV_ROW =
  'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] motion-reduce:active:scale-100 border-l-4';
export const SIDEBAR_NAV_ACTIVE = 'bg-accent text-accent-foreground shadow-sm border-l-primary';
export const SIDEBAR_NAV_IDLE =
  'text-foreground/80 hover:text-foreground hover:bg-accent/60 border-l-transparent dark:hover:bg-accent/40';
