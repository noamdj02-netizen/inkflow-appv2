import type {
  DashboardClientsView,
  DashboardFinanceView,
  DashboardPlanningView,
  DashboardRequestsSubTab,
  DashboardSettingsTabId,
  DashboardTabId,
} from '@/components/dashboard/dashboardProNavShared';

/** Filtre source dans la file d'attente unifiée (Demandes > inbox). */
export type RequestsSourceFilter = 'agenda' | 'book' | 'brief';

export type DashboardNavSearchState = {
  tab: DashboardTabId;
  requestsSubTab?: 'inbox' | 'history';
  requestsSource?: RequestsSourceFilter;
  settingsTab?: DashboardSettingsTabId;
  financeView?: DashboardFinanceView;
  planningView?: DashboardPlanningView;
  clientsView?: DashboardClientsView;
  /** ISO date — onglet appointments */
  date?: string;
  /** Legacy ?tab=agenda → overview + section synthèse */
  overviewAgendaSection?: boolean;
};

const TAB_IDS = new Set<DashboardTabId>([
  'overview',
  'analytics',
  'requests',
  'stock',
  'agenda',
  'appointments',
  'flash',
  'clients',
  'finance',
  'messaging',
  'portfolio',
  'settings',
  'notifications',
  'account',
  'etablissement',
]);

const REQUESTS_SOURCE = new Set<RequestsSourceFilter>(['agenda', 'book', 'brief']);

const NAV_PARAM_KEYS = [
  'tab',
  'requestsSubTab',
  'requestsSource',
  'settingsTab',
  'financeView',
  'planningView',
  'clientsView',
  'date',
  'settings',
] as const;

function isRequestsSource(v: string | null): v is RequestsSourceFilter {
  return v != null && REQUESTS_SOURCE.has(v as RequestsSourceFilter);
}

/** rdv / bookings / projects (legacy) → inbox + filtre source. */
export function normalizeRequestsNav(
  subTab: string | null,
  source: string | null
): Pick<DashboardNavSearchState, 'requestsSubTab' | 'requestsSource'> {
  const src = isRequestsSource(source) ? source : undefined;

  if (!subTab || subTab === 'inbox') {
    return { requestsSubTab: 'inbox', requestsSource: src };
  }
  if (subTab === 'history') {
    return { requestsSubTab: 'history' };
  }
  if (subTab === 'rdv') {
    return { requestsSubTab: 'inbox', requestsSource: src ?? 'agenda' };
  }
  if (subTab === 'bookings') {
    return { requestsSubTab: 'inbox', requestsSource: src ?? 'book' };
  }
  if (subTab === 'projects') {
    return { requestsSubTab: 'inbox', requestsSource: src ?? 'brief' };
  }
  return { requestsSubTab: 'inbox' };
}

/** Lit l'état de navigation depuis l'URL (partageable). */
export function parseDashboardNavSearch(params: URLSearchParams): Partial<DashboardNavSearchState> {
  const out: Partial<DashboardNavSearchState> = {};

  const tabRaw = params.get('tab');
  if (tabRaw === 'agenda') {
    out.tab = 'overview';
    out.overviewAgendaSection = true;
  } else if (tabRaw === 'account') {
    out.tab = 'settings';
    out.settingsTab = 'account';
  } else if (tabRaw === 'etablissement') {
    out.tab = 'settings';
    out.settingsTab = 'etablissement';
  } else if (tabRaw && TAB_IDS.has(tabRaw as DashboardTabId)) {
    out.tab = tabRaw as DashboardTabId;
  }

  /** Legacy : ?settings=payments → tab settings */
  const legacySettings = params.get('settings');
  if (legacySettings && !out.tab) {
    out.tab = 'settings';
    out.settingsTab = legacySettings as DashboardSettingsTabId;
  }

  const { requestsSubTab, requestsSource } = normalizeRequestsNav(
    params.get('requestsSubTab'),
    params.get('requestsSource')
  );
  if (params.get('requestsSubTab') || params.get('requestsSource')) {
    out.requestsSubTab = requestsSubTab;
    if (requestsSource) out.requestsSource = requestsSource;
  }

  const settingsTab = params.get('settingsTab');
  if (settingsTab) out.settingsTab = settingsTab as DashboardSettingsTabId;

  const financeView = params.get('financeView');
  if (financeView === 'revenus' || financeView === 'acomptes' || financeView === 'pilotage') {
    out.financeView = financeView;
  }

  const planningView = params.get('planningView');
  if (planningView === 'week' || planningView === 'month') {
    out.planningView = planningView;
  }

  const clientsView = params.get('clientsView');
  if (clientsView === 'overview' || clientsView === 'projects' || clientsView === 'loyalty') {
    out.clientsView = clientsView;
  }

  const date = params.get('date');
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    out.date = date;
  }

  return out;
}

const DEFAULT_TAB: DashboardTabId = 'overview';

/** Construit les query params de navigation (sans effacer les params métier one-shot). */
export function buildDashboardNavQuery(
  state: DashboardNavSearchState,
  preserve: URLSearchParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  )
): URLSearchParams {
  const p = new URLSearchParams(preserve.toString());

  for (const key of NAV_PARAM_KEYS) {
    p.delete(key);
  }

  const tab = state.tab ?? DEFAULT_TAB;
  if (tab !== DEFAULT_TAB) {
    p.set('tab', tab);
  }

  if (tab === 'requests') {
    const sub = state.requestsSubTab ?? 'inbox';
    if (sub !== 'inbox') {
      p.set('requestsSubTab', sub);
    }
    if (sub === 'inbox' && state.requestsSource) {
      p.set('requestsSource', state.requestsSource);
    }
  }

  if (tab === 'settings' && state.settingsTab && state.settingsTab !== 'home') {
    p.set('settingsTab', state.settingsTab);
  }

  if (tab === 'finance' && state.financeView && state.financeView !== 'revenus') {
    p.set('financeView', state.financeView);
  }

  if (tab === 'appointments') {
    if (state.planningView && state.planningView !== 'week') {
      p.set('planningView', state.planningView);
    }
    if (state.date) {
      p.set('date', state.date);
    }
  }

  if (tab === 'clients' && state.clientsView && state.clientsView !== 'overview') {
    p.set('clientsView', state.clientsView);
  }

  return p;
}

/** Met à jour l'URL sans rechargement (deep links partageables). */
export function syncDashboardNavUrl(state: DashboardNavSearchState): void {
  if (typeof window === 'undefined') return;
  const q = buildDashboardNavQuery(state);
  const qs = q.toString();
  const next = qs ? `/dashboard?${qs}` : '/dashboard';
  const current = `${window.location.pathname}${window.location.search}`;
  if (current !== next) {
    window.history.replaceState({}, '', next);
  }
}
