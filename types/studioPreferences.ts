/**
 * Préférences dashboard / modules — stockées en JSONB (`dashboard_preferences` sur inkflow_studios).
 * schema_version permet les migrations côté app sans casser les anciens clients.
 */
export const STUDIO_PREFERENCES_SCHEMA_VERSION = 1 as const;

/** Modules activables (feature toggles) */
export type StudioModuleId =
  | 'loyalty'
  | 'flash_shop'
  | 'consent_forms'
  | 'healing_followup'
  | 'finance'
  | 'planning'
  | 'vitrine';

export interface StudioModuleToggle {
  enabled: boolean;
  /** Afficher en haut de sidebar */
  pinned?: boolean;
}

export type SidebarGroupId = 'dashboards' | 'pages' | 'tools';

export interface StudioSidebarItemConfig {
  id: string;
  group: SidebarGroupId;
  order: number;
  visible: boolean;
  /** Si défini, liaison avec un module */
  module?: StudioModuleId;
}

export interface StudioDashboardPreferences {
  schema_version: typeof STUDIO_PREFERENCES_SCHEMA_VERSION;
  /** Modules métier */
  modules: Partial<Record<StudioModuleId, StudioModuleToggle>>;
  /** Navigation (optionnel — sinon défaut code) */
  sidebar?: {
    items: StudioSidebarItemConfig[];
  };
  /** Aligné sur DashboardLayout (lib/dashboardWidgetOrder) */
  overview_layout?: {
    leftColumn: string[];
    rightColumn: string[];
    kpiOrder: string[];
  };
  /** Mode atelier synchronisé serveur (optionnel ; le localStorage reste prioritaire au MVP) */
  privacy_mode_default?: boolean;
}

export const DEFAULT_STUDIO_DASHBOARD_PREFERENCES: StudioDashboardPreferences = {
  schema_version: STUDIO_PREFERENCES_SCHEMA_VERSION,
  modules: {
    loyalty: { enabled: true },
    flash_shop: { enabled: true },
    consent_forms: { enabled: true },
    healing_followup: { enabled: false },
    finance: { enabled: true },
    planning: { enabled: true },
    vitrine: { enabled: true },
  },
};
