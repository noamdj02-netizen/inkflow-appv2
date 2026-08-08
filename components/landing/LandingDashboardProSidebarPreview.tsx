import React, { useCallback, useMemo } from 'react';
import { DashboardProSidebar } from '@/components/dashboard/DashboardProSidebar';
import {
  buildQuickAccessInsight,
  DEFAULT_QUICK_ACCESS_PINS,
  type QuickAccessItemId,
} from '@/lib/dashboardQuickAccess';
import type { RequestsSourceFilter } from '@/lib/dashboardNavUrl';
import {
  type DashboardClientsView,
  type DashboardExpandedMenus,
  type DashboardFinanceView,
  type DashboardPlanningView,
  type DashboardRequestsSubTab,
  type DashboardSettingsTabId,
  type DashboardTabId,
} from '@/components/dashboard/dashboardProNavShared';

const TAB_TO_QUICK: Partial<Record<DashboardTabId, QuickAccessItemId>> = {
  overview: 'overview',
  analytics: 'analytics',
  requests: 'requests',
  agenda: 'agenda',
  appointments: 'appointments',
  clients: 'clients',
  finance: 'finance',
  messaging: 'messaging',
  settings: 'settings',
};

const QUICK_TO_TAB: Partial<Record<QuickAccessItemId, DashboardTabId>> = {
  overview: 'overview',
  analytics: 'analytics',
  requests: 'requests',
  agenda: 'agenda',
  appointments: 'appointments',
  clients: 'clients',
  finance: 'finance',
  messaging: 'messaging',
  settings: 'settings',
};

const LANDING_DEMO_SURFACE = '#333';

const DASHBOARD_SIDEBAR_THEME: React.CSSProperties = {
  '--sidebar': LANDING_DEMO_SURFACE,
  '--sidebar-foreground': 'oklch(1 0 0)',
  '--sidebar-primary': 'oklch(1 0 0)',
  '--sidebar-primary-foreground': LANDING_DEMO_SURFACE,
  '--sidebar-accent': 'rgba(255, 255, 255, 0.1)',
  '--sidebar-accent-foreground': 'oklch(1 0 0)',
  '--sidebar-border': 'rgba(255, 255, 255, 0.1)',
  '--sidebar-ring': 'oklch(0.72 0 0)',
  '--border': 'rgba(255, 255, 255, 0.1)',
  '--accent': 'rgba(255, 255, 255, 0.1)',
  '--accent-foreground': 'oklch(1 0 0)',
  '--foreground': 'oklch(1 0 0)',
  '--primary': 'oklch(1 0 0)',
  '--primary-foreground': LANDING_DEMO_SURFACE,
  '--muted-foreground': 'rgba(255, 255, 255, 0.45)',
} as React.CSSProperties;

export type LandingDashboardProSidebarPreviewProps = {
  activeTab: DashboardTabId;
  setActiveTab: React.Dispatch<React.SetStateAction<DashboardTabId>>;
  expandedMenus: DashboardExpandedMenus;
  setExpandedMenus: React.Dispatch<React.SetStateAction<DashboardExpandedMenus>>;
  onPausePlayback?: () => void;
  onResumePlayback?: () => void;
};

/** Sidebar Dashboard Pro — pilotée par la démo landing (navigation + fond #333). */
export function LandingDashboardProSidebarPreview({
  activeTab,
  setActiveTab,
  expandedMenus,
  setExpandedMenus,
  onPausePlayback,
  onResumePlayback,
}: LandingDashboardProSidebarPreviewProps) {
  const [settingsTab, setSettingsTab] = React.useState<DashboardSettingsTabId>('home');
  const [requestsSubTab, setRequestsSubTab] = React.useState<DashboardRequestsSubTab>('inbox');
  const [planningView, setPlanningView] = React.useState<DashboardPlanningView>('week');
  const [financeView, setFinanceView] = React.useState<DashboardFinanceView>('revenus');
  const [clientsView, setClientsView] = React.useState<DashboardClientsView>('overview');
  const [, setRequestsSourceFilter] = React.useState<RequestsSourceFilter | null>(null);

  const quickAccess = useMemo(
    () => ({
      pins: [...DEFAULT_QUICK_ACCESS_PINS] as QuickAccessItemId[],
      recents: ['clients', 'finance'] as QuickAccessItemId[],
      insight: buildQuickAccessInsight({
        demandes: { total: 3, pendingRdv: 2, pendingVitrine: 1, pendingProjects: 0 },
        todaySessionCount: 2,
        lastRecentId: 'clients',
        flags: { planning: true, finance: true },
      }),
      togglePin: () => ({ atMax: false }),
      activeQuickId: TAB_TO_QUICK[activeTab] ?? null,
    }),
    [activeTab]
  );

  const handleSidebarNav = useCallback(
    (action: () => void) => {
      onPausePlayback?.();
      action();
    },
    [onPausePlayback]
  );

  const handleQuickAccessNavigate = useCallback(
    (id: QuickAccessItemId) => {
      onPausePlayback?.();
      const tab = QUICK_TO_TAB[id];
      if (tab) setActiveTab(tab);
    },
    [onPausePlayback, setActiveTab]
  );

  const blockLeavingPreview = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement).closest('a[href]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (href && href.startsWith('/')) {
      event.preventDefault();
    }
  }, []);

  return (
    <div
      data-theme="dark"
      style={DASHBOARD_SIDEBAR_THEME}
      className="h-full w-[260px] shrink-0 overflow-hidden bg-[#333] text-white [&_.app-shell-sidebar]:!static [&_.app-shell-sidebar]:!h-full [&_.app-shell-sidebar]:!max-w-none [&_.app-shell-sidebar]:!translate-x-0 [&_.app-shell-sidebar]:!border-white/10 [&_.app-shell-sidebar]:!bg-[#333] [&_.app-shell-sidebar]:!text-white [&_.app-shell-sidebar]:!shadow-none [&_.app-shell-sidebar>div[aria-hidden]]:!bg-[#333] [&_[data-slot=sidebar-header]]:border-white/10 [&_[data-slot=sidebar-footer]]:border-white/10"
      onClickCapture={blockLeavingPreview}
      onMouseEnter={onPausePlayback}
      onMouseLeave={onResumePlayback}
      onFocusCapture={onPausePlayback}
      onBlurCapture={onResumePlayback}
    >
      <DashboardProSidebar
        sidebarOpen
        onCloseMobile={() => undefined}
        user={{ studioName: 'Atelier Noir', email: 'demo@ink-flow.me' }}
        quickAccess={quickAccess}
        onQuickAccessNavigate={handleQuickAccessNavigate}
        activeTab={activeTab}
        settingsTab={settingsTab}
        requestsSubTab={requestsSubTab}
        planningView={planningView}
        financeView={financeView}
        clientsView={clientsView}
        expandedMenus={expandedMenus}
        setExpandedMenus={setExpandedMenus}
        moduleFlags={{
          finance: true,
          planning: true,
          loyalty: true,
          vitrine: true,
          flashShop: true,
        }}
        demandes={{ total: 3, pendingRdv: 2, pendingVitrine: 1, pendingProjects: 0 }}
        messagingUnreadTotal={0}
        notificationsUnreadCount={0}
        isCollaboratorUser={false}
        isRestricted={false}
        studioSlug="atelier-noir"
        handleSidebarNav={handleSidebarNav}
        setActiveTab={setActiveTab}
        setSettingsTab={setSettingsTab}
        setRequestsSubTab={setRequestsSubTab}
        setRequestsSourceFilter={setRequestsSourceFilter}
        setPlanningView={setPlanningView}
        setFinanceView={setFinanceView}
        setClientsView={setClientsView}
        onOpenMessaging={() => setActiveTab('messaging')}
        onLogout={() => undefined}
        canViewAdvancedStats
        canAccessFidelite
      />
    </div>
  );
}
