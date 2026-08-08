import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  LogOut,
  LifeBuoy,
  ChevronRight,
  X,
  MessageSquare,
  ClipboardList,
  BarChart3,
  FolderOpen,
  ExternalLink,
  Package,
  LineChart,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import type { RequestsSourceFilter } from '@/lib/dashboardNavUrl';
import { SidebarSubmenuMotion } from '@/components/motion/SidebarSubmenuMotion';
import { DashboardSidebarNavButton } from '@/components/dashboard/DashboardSidebarNavButton';
import { DashboardSidebarQuickAccess } from '@/components/dashboard/DashboardSidebarQuickAccess';
import { SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import type { QuickAccessItemId } from '@/lib/dashboardQuickAccess';
import type { useDashboardQuickAccess } from '@/hooks/useDashboardQuickAccess';
import {
  SIDEBAR_NAV_ACTIVE,
  SIDEBAR_NAV_IDLE,
  SIDEBAR_NAV_ROW,
  type DashboardClientsView,
  type DashboardExpandedMenus,
  type DashboardFinanceView,
  type DashboardPlanningView,
  type DashboardRequestsSubTab,
  type DashboardSettingsTabId,
  type DashboardTabId,
} from '@/components/dashboard/dashboardProNavShared';

export type DashboardProSidebarProps = {
  sidebarOpen: boolean;
  onCloseMobile: () => void;
  user: { studioName?: string | null; email?: string | null; avatar?: string | null } | null;
  quickAccess: ReturnType<typeof useDashboardQuickAccess>;
  onQuickAccessNavigate: (id: QuickAccessItemId) => void;
  activeTab: DashboardTabId;
  settingsTab: DashboardSettingsTabId;
  requestsSubTab: DashboardRequestsSubTab;
  planningView: DashboardPlanningView;
  financeView: DashboardFinanceView;
  clientsView: DashboardClientsView;
  expandedMenus: DashboardExpandedMenus;
  setExpandedMenus: React.Dispatch<React.SetStateAction<DashboardExpandedMenus>>;
  moduleFlags: {
    finance: boolean;
    planning: boolean;
    loyalty: boolean;
    vitrine: boolean;
    flashShop: boolean;
  };
  demandes: {
    total: number;
    pendingRdv: number;
    pendingVitrine: number;
    pendingProjects: number;
  };
  messagingUnreadTotal: number;
  notificationsUnreadCount: number;
  isCollaboratorUser: boolean;
  isRestricted: boolean;
  studioSlug: string | null;
  handleSidebarNav: (action: () => void, allowWhenRestricted?: boolean) => void;
  setActiveTab: React.Dispatch<React.SetStateAction<DashboardTabId>>;
  setSettingsTab: React.Dispatch<React.SetStateAction<DashboardSettingsTabId>>;
  setRequestsSubTab: React.Dispatch<React.SetStateAction<DashboardRequestsSubTab>>;
  setRequestsSourceFilter: React.Dispatch<React.SetStateAction<RequestsSourceFilter | null>>;
  setPlanningView: React.Dispatch<React.SetStateAction<DashboardPlanningView>>;
  setFinanceView: React.Dispatch<React.SetStateAction<DashboardFinanceView>>;
  setClientsView: React.Dispatch<React.SetStateAction<DashboardClientsView>>;
  /** Ouvre Suivi client sans fil de discussion pré-sélectionné (reset deep link messagerie). */
  onOpenMessaging: () => void;
  onLogout: () => void;
  canViewAdvancedStats: boolean;
  canAccessFidelite: boolean;
};

export function DashboardProSidebar({
  sidebarOpen,
  onCloseMobile,
  user,
  quickAccess,
  onQuickAccessNavigate,
  activeTab,
  settingsTab,
  requestsSubTab,
  planningView,
  financeView,
  clientsView,
  expandedMenus,
  setExpandedMenus,
  moduleFlags,
  demandes,
  messagingUnreadTotal,
  notificationsUnreadCount,
  isCollaboratorUser,
  isRestricted,
  studioSlug,
  handleSidebarNav,
  setActiveTab,
  setSettingsTab,
  setRequestsSubTab,
  setRequestsSourceFilter,
  setPlanningView,
  setFinanceView,
  setClientsView,
  onOpenMessaging,
  onLogout,
  canViewAdvancedStats,
  canAccessFidelite,
}: DashboardProSidebarProps) {
  return (
    <aside
      aria-label="Navigation principale"
      data-lenis-prevent
      className={`fixed lg:static inset-y-0 left-0 z-[60] w-[260px] max-w-[88vw] sm:max-w-[85vw] border-r border-border bg-sidebar flex flex-col min-h-0 transform transition-transform duration-200 ease-out motion-reduce:transition-none rounded-r-2xl lg:rounded-none shadow-sm lg:shadow-none app-shell-sidebar ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="absolute inset-0 z-0 bg-sidebar" aria-hidden />

      <SidebarHeader className="relative z-10 border-b border-zinc-100 dark:border-zinc-800/50 safe-top p-0">
        {/* Zone logo — style ByeWind */}
        <div className="px-4 py-4 flex items-center justify-between">
          <a
            href="/dashboard"
            className="flex items-center gap-3 min-w-0 group"
            aria-label="Tableau de bord"
          >
            <Logo size="lg" className="rounded-xl group-hover:opacity-90 transition-opacity" />
            <div className="min-w-0">
              <span className="block text-[15px] font-bold tracking-tight text-zinc-900 dark:text-white">
                InkFlow
              </span>
              <span className="block text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                {user.studioName || 'Mon studio'}
              </span>
            </div>
          </a>
          <button
            type="button"
            onClick={() => onCloseMobile()}
            className="lg:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors touch-manipulation"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="relative z-10 flex-1 min-h-0 px-0 py-0 overflow-y-auto overscroll-contain">
        <DashboardSidebarQuickAccess
          pins={quickAccess.pins}
          recents={quickAccess.recents}
          insight={quickAccess.insight}
          activeQuickId={quickAccess.activeQuickId}
          onNavigate={onQuickAccessNavigate}
          onTogglePin={quickAccess.togglePin}
          getBadge={(id) => (id === 'requests' && demandes.total > 0 ? demandes.total : undefined)}
        />

        <div className="mx-4 border-t border-zinc-100 dark:border-zinc-800/50 my-1" />

        {/* Navigation — Style ByeWind avec sous-menus dépliables */}
        <nav className="relative z-10 flex-1 min-h-0 px-3 py-2 overflow-y-auto overscroll-contain space-y-4">
          {/* Section TABLEAUX DE BORD */}
          <div>
            <p className="dashboardSectionTitle px-3 mb-1.5">Tableaux de bord</p>
            <div className="space-y-0.5">
              {/* Vue d'ensemble */}
              <button
                onClick={() =>
                  handleSidebarNav(() => {
                    setActiveTab('overview');
                    onCloseMobile();
                  })
                }
                className={`${SIDEBAR_NAV_ROW} ${
                  activeTab === 'overview' ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_IDLE
                }`}
              >
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">Vue d'ensemble</span>
              </button>

              {canViewAdvancedStats ? (
                <button
                  onClick={() =>
                    handleSidebarNav(() => {
                      setActiveTab('analytics');
                      onCloseMobile();
                    })
                  }
                  className={`${SIDEBAR_NAV_ROW} ${
                    activeTab === 'analytics' ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_IDLE
                  }`}
                >
                  <BarChart3 className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">Statistiques</span>
                </button>
              ) : null}

              {/* Finance avec sous-menu */}
              {moduleFlags.finance && (
                <div>
                  <DashboardSidebarNavButton
                    onClick={() =>
                      setExpandedMenus((prev) => ({ ...prev, finance: !prev.finance }))
                    }
                    className={`${SIDEBAR_NAV_ROW} ${
                      activeTab === 'finance' ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_IDLE
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">Finance</span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expandedMenus.finance ? 'rotate-90' : ''}`}
                    />
                  </DashboardSidebarNavButton>
                  <SidebarSubmenuMotion open={expandedMenus.finance}>
                    <button
                      onClick={() =>
                        handleSidebarNav(() => {
                          setActiveTab('finance');
                          setFinanceView('revenus');
                          onCloseMobile();
                        })
                      }
                      className={`type-body w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg transition-all ${activeTab === 'finance' && financeView === 'revenus' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'finance' && financeView === 'revenus' ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                      />
                      Revenus
                    </button>
                    <button
                      onClick={() =>
                        handleSidebarNav(() => {
                          setActiveTab('finance');
                          setFinanceView('acomptes');
                          onCloseMobile();
                        })
                      }
                      className={`type-body w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg transition-all ${activeTab === 'finance' && financeView === 'acomptes' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'finance' && financeView === 'acomptes' ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                      />
                      Acomptes
                    </button>
                    <button
                      onClick={() =>
                        handleSidebarNav(() => {
                          setActiveTab('finance');
                          setFinanceView('pilotage');
                          onCloseMobile();
                        })
                      }
                      className={`type-body w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg transition-all ${activeTab === 'finance' && financeView === 'pilotage' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                    >
                      <LineChart className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      Pilotage AE
                    </button>
                  </SidebarSubmenuMotion>
                </div>
              )}

              {/* Planning avec sous-menu */}
              {moduleFlags.planning && (
                <div>
                  <DashboardSidebarNavButton
                    onClick={() =>
                      setExpandedMenus((prev) => ({ ...prev, planning: !prev.planning }))
                    }
                    className={`${SIDEBAR_NAV_ROW} ${
                      activeTab === 'appointments' ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_IDLE
                    }`}
                  >
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">Planning</span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expandedMenus.planning ? 'rotate-90' : ''}`}
                    />
                  </DashboardSidebarNavButton>
                  <SidebarSubmenuMotion open={expandedMenus.planning}>
                    <button
                      onClick={() =>
                        handleSidebarNav(() => {
                          setActiveTab('appointments');
                          setPlanningView('week');
                          onCloseMobile();
                        })
                      }
                      className={`type-body w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg transition-all ${activeTab === 'appointments' && planningView === 'week' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'appointments' && planningView === 'week' ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                      />
                      Vue semaine
                    </button>
                    <button
                      onClick={() =>
                        handleSidebarNav(() => {
                          setActiveTab('appointments');
                          setPlanningView('month');
                          onCloseMobile();
                        })
                      }
                      className={`type-body w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg transition-all ${activeTab === 'appointments' && planningView === 'month' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'appointments' && planningView === 'month' ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                      />
                      Vue mois
                    </button>
                    <button
                      onClick={() =>
                        handleSidebarNav(() => {
                          setActiveTab('settings');
                          setSettingsTab('availability');
                          onCloseMobile();
                        })
                      }
                      className="w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 flex-shrink-0" />
                      Disponibilités
                    </button>
                  </SidebarSubmenuMotion>
                </div>
              )}
            </div>
          </div>

          {/* Section PAGES */}
          <div>
            <p className="dashboardSectionTitle px-3 mb-1.5">Pages</p>
            <div className="space-y-0.5">
              {/* Demandes avec sous-menu */}
              <div>
                <DashboardSidebarNavButton
                  onClick={() =>
                    setExpandedMenus((prev) => ({ ...prev, requests: !prev.requests }))
                  }
                  className={`${SIDEBAR_NAV_ROW} ${
                    activeTab === 'requests' ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_IDLE
                  }`}
                >
                  <ClipboardList className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">Demandes</span>
                  {demandes.total > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                      {demandes.total > 99 ? '99+' : demandes.total}
                    </span>
                  )}
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expandedMenus.requests ? 'rotate-90' : ''}`}
                  />
                </DashboardSidebarNavButton>
                <SidebarSubmenuMotion open={expandedMenus.requests}>
                  <button
                    onClick={() =>
                      handleSidebarNav(() => {
                        setActiveTab('requests');
                        setRequestsSubTab('inbox');
                        setRequestsSourceFilter(null);
                        onCloseMobile();
                      })
                    }
                    className={`type-body w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg transition-all ${activeTab === 'requests' && requestsSubTab !== 'history' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'requests' && requestsSubTab !== 'history' ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                    />
                    <span className="flex-1 text-left" title="File d’attente unifiée">
                      File d’attente
                    </span>
                    {demandes.total > 0 && (
                      <span className="min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
                        {demandes.total > 9 ? '9+' : demandes.total}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() =>
                      handleSidebarNav(() => {
                        setActiveTab('requests');
                        setRequestsSubTab('history');
                        setRequestsSourceFilter(null);
                        onCloseMobile();
                      })
                    }
                    className={`type-body w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg transition-all ${activeTab === 'requests' && requestsSubTab === 'history' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'requests' && requestsSubTab === 'history' ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                    />
                    Historique
                  </button>
                </SidebarSubmenuMotion>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleSidebarNav(() => {
                    setActiveTab('stock');
                    onCloseMobile();
                  })
                }
                className={`${SIDEBAR_NAV_ROW} ${
                  activeTab === 'stock' ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_IDLE
                }`}
              >
                <Package className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">Traçabilité</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSidebarNav(() => {
                    onOpenMessaging();
                    onCloseMobile();
                  })
                }
                className={`${SIDEBAR_NAV_ROW} ${
                  activeTab === 'messaging' ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_IDLE
                }`}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">Messagerie</span>
                {messagingUnreadTotal > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                    {messagingUnreadTotal > 99 ? '99+' : messagingUnreadTotal}
                  </span>
                )}
              </button>

              {/* Clients avec sous-menu */}
              <div>
                <DashboardSidebarNavButton
                  onClick={() => setExpandedMenus((prev) => ({ ...prev, clients: !prev.clients }))}
                  className={`${SIDEBAR_NAV_ROW} ${
                    activeTab === 'clients' ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_IDLE
                  }`}
                >
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">Clients</span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expandedMenus.clients ? 'rotate-90' : ''}`}
                  />
                </DashboardSidebarNavButton>
                <SidebarSubmenuMotion open={expandedMenus.clients}>
                  <button
                    onClick={() =>
                      handleSidebarNav(() => {
                        setActiveTab('clients');
                        setClientsView('overview');
                        onCloseMobile();
                      })
                    }
                    className={`type-body w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg transition-all ${activeTab === 'clients' && clientsView === 'overview' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'clients' && clientsView === 'overview' ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                    />
                    Vue d'ensemble
                  </button>
                  <button
                    onClick={() =>
                      handleSidebarNav(() => {
                        setActiveTab('clients');
                        setClientsView('projects');
                        onCloseMobile();
                      })
                    }
                    className={`type-body w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg transition-all ${activeTab === 'clients' && clientsView === 'projects' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'clients' && clientsView === 'projects' ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                    />
                    Projets
                  </button>
                  {moduleFlags.loyalty && canAccessFidelite && (
                    <button
                      onClick={() =>
                        handleSidebarNav(() => {
                          setActiveTab('clients');
                          setClientsView('loyalty');
                          onCloseMobile();
                        })
                      }
                      className={`type-body w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg transition-all ${activeTab === 'clients' && clientsView === 'loyalty' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'clients' && clientsView === 'loyalty' ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                      />
                      Fidélité
                    </button>
                  )}
                </SidebarSubmenuMotion>
              </div>

              {/* Ma vitrine avec sous-menu */}
              {(moduleFlags.flashShop || moduleFlags.vitrine) && (
                <div>
                  <DashboardSidebarNavButton
                    onClick={() =>
                      setExpandedMenus((prev) => ({ ...prev, vitrine: !prev.vitrine }))
                    }
                    className={`${SIDEBAR_NAV_ROW} ${
                      activeTab === 'flash' ||
                      activeTab === 'portfolio' ||
                      (activeTab === 'settings' && settingsTab === 'vitrine')
                        ? SIDEBAR_NAV_ACTIVE
                        : SIDEBAR_NAV_IDLE
                    }`}
                  >
                    <FolderOpen className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">Ma vitrine</span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expandedMenus.vitrine ? 'rotate-90' : ''}`}
                    />
                  </DashboardSidebarNavButton>
                  <SidebarSubmenuMotion open={expandedMenus.vitrine}>
                    {moduleFlags.flashShop && (
                      <button
                        onClick={() =>
                          handleSidebarNav(() => {
                            setActiveTab('flash');
                            onCloseMobile();
                          })
                        }
                        className={`type-body w-full flex flex-col items-start gap-0 pl-9 pr-3 py-1.5 rounded-lg transition-all text-left ${activeTab === 'flash' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'flash' ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                          />
                          Galerie Flash
                        </span>
                        <span className="pl-3.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                          Flash à vendre
                        </span>
                      </button>
                    )}
                    {moduleFlags.flashShop && (
                      <button
                        onClick={() =>
                          handleSidebarNav(() => {
                            setActiveTab('portfolio');
                            onCloseMobile();
                          })
                        }
                        className={`type-body w-full flex flex-col items-start gap-0 pl-9 pr-3 py-1.5 rounded-lg transition-all text-left ${activeTab === 'portfolio' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'portfolio' ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                          />
                          Portfolio
                        </span>
                        <span className="pl-3.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                          Réalisations passées
                        </span>
                      </button>
                    )}
                    {moduleFlags.vitrine && (
                      <button
                        onClick={() =>
                          handleSidebarNav(() => {
                            setActiveTab('settings');
                            setSettingsTab('vitrine');
                            onCloseMobile();
                          }, true)
                        }
                        className={`type-body w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg transition-all ${activeTab === 'settings' && settingsTab === 'vitrine' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'settings' && settingsTab === 'vitrine' ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                        />
                        Personnaliser
                      </button>
                    )}
                    {moduleFlags.vitrine &&
                      studioSlug &&
                      (isRestricted ? (
                        <button
                          onClick={() => handleSidebarNav(() => {})}
                          className="w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs text-foreground hover:bg-accent transition-all text-left"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          Voir ma vitrine
                        </button>
                      ) : (
                        <a
                          href={`/studio/${studioSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs text-foreground hover:bg-accent transition-all"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          Voir ma vitrine
                        </a>
                      ))}
                  </SidebarSubmenuMotion>
                </div>
              )}

              {/* Paramètres avec sous-menu */}
              <div>
                <DashboardSidebarNavButton
                  onClick={() =>
                    setExpandedMenus((prev) => ({ ...prev, settings: !prev.settings }))
                  }
                  className={`${SIDEBAR_NAV_ROW} ${
                    activeTab === 'settings' || activeTab === 'notifications'
                      ? SIDEBAR_NAV_ACTIVE
                      : SIDEBAR_NAV_IDLE
                  }`}
                >
                  <Settings className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">Paramètres</span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expandedMenus.settings ? 'rotate-90' : ''}`}
                  />
                </DashboardSidebarNavButton>
                <SidebarSubmenuMotion open={expandedMenus.settings}>
                  <button
                    onClick={() =>
                      handleSidebarNav(() => {
                        setActiveTab('settings');
                        setSettingsTab('home');
                        onCloseMobile();
                      }, true)
                    }
                    className={`type-body w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg transition-all ${activeTab === 'settings' && settingsTab === 'home' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'settings' && settingsTab === 'home' ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                    />
                    Tous les paramètres
                  </button>
                  <button
                    onClick={() =>
                      handleSidebarNav(() => {
                        setActiveTab('settings');
                        setSettingsTab('account');
                        onCloseMobile();
                      }, true)
                    }
                    className={`type-body w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg transition-all ${activeTab === 'settings' && settingsTab === 'account' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'settings' && settingsTab === 'account' ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                    />
                    Mon compte
                  </button>
                  {!isCollaboratorUser && (
                    <button
                      onClick={() =>
                        handleSidebarNav(() => {
                          setActiveTab('settings');
                          setSettingsTab('etablissement');
                          onCloseMobile();
                        })
                      }
                      className={`type-body w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg transition-all ${activeTab === 'settings' && settingsTab === 'etablissement' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'settings' && settingsTab === 'etablissement' ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                      />
                      Établissement
                    </button>
                  )}
                  <button
                    onClick={() =>
                      handleSidebarNav(() => {
                        setActiveTab('settings');
                        setSettingsTab('billing');
                        onCloseMobile();
                      }, true)
                    }
                    className={`type-body w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg transition-all ${activeTab === 'settings' && settingsTab === 'billing' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'settings' && settingsTab === 'billing' ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                    />
                    Abonnement
                  </button>
                  <button
                    onClick={() =>
                      handleSidebarNav(() => {
                        setActiveTab('notifications');
                        onCloseMobile();
                      })
                    }
                    className={`type-body w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg transition-all ${activeTab === 'notifications' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:bg-zinc-800/50'}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'notifications' ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                    />
                    <span className="flex-1 text-left">Notifications</span>
                    {notificationsUnreadCount > 0 && (
                      <span className="min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
                        {notificationsUnreadCount > 9 ? '9+' : notificationsUnreadCount}
                      </span>
                    )}
                  </button>
                  {moduleFlags.vitrine && (
                    <button
                      onClick={() =>
                        handleSidebarNav(() => {
                          setActiveTab('settings');
                          setSettingsTab('vitrine');
                          onCloseMobile();
                        }, true)
                      }
                      className={`type-body w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg transition-all ${activeTab === 'settings' && settingsTab === 'vitrine' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'settings' && settingsTab === 'vitrine' ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                      />
                      Vitrine
                    </button>
                  )}
                </SidebarSubmenuMotion>
              </div>
            </div>
          </div>
        </nav>
      </SidebarContent>

      {/* Footer — Déconnexion */}
      <SidebarFooter className="relative z-10 mt-auto border-t border-zinc-100 dark:border-zinc-800/50 safe-bottom p-0">
        <div className="px-3 py-3 space-y-0.5">
          {/* V2: Parrainage masqué pour le MVP
            <a
              href="/referral"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
            >
              <Gift className="w-4 h-4 flex-shrink-0" />
              <span>Parrainage</span>
            </a>
            */}
          <a
            href="/dashboard/signalement"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-900 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all active:scale-[0.98] motion-reduce:active:scale-100 border-l-4 border-l-transparent"
          >
            <LifeBuoy className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
            <span>Signaler un bug</span>
          </a>
          <button
            onClick={() => void onLogout()}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all active:scale-[0.98] motion-reduce:active:scale-100 border-l-4 border-l-transparent"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Déconnexion</span>
          </button>
        </div>
      </SidebarFooter>
    </aside>
  );
}
