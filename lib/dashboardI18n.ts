import type { LucideIcon } from 'lucide-react';
import {
  Settings,
  PanelsTopLeft,
  CreditCard,
  Percent,
  Crown,
  Heart,
  FileCheck,
  Clock,
  Calendar,
  Globe,
  ListOrdered,
  Star,
  MessageSquare,
  User,
  Building2,
} from 'lucide-react';
import type {
  DashboardClientsView,
  DashboardFinanceView,
  DashboardPlanningView,
  DashboardRequestsSubTab,
  DashboardSettingsTabId,
  DashboardTabId,
} from '@/components/dashboard/dashboardProNavShared';
import type { RequestsSourceFilter } from '@/lib/dashboardNavUrl';
import type { PendingDemandesCounts } from '@/hooks/usePendingDemandesCounts';
import {
  type QuickAccessInsight,
  type QuickAccessItemId,
  type QuickAccessModuleFlags,
} from '@/lib/dashboardQuickAccess';

export type DashboardTranslate = (key: string) => string;

const SETTINGS_TAB_ICONS: Record<DashboardSettingsTabId, LucideIcon> = {
  home: Settings,
  general: Settings,
  modules: PanelsTopLeft,
  payments: CreditCard,
  finance_display: Percent,
  billing: Crown,
  care: Heart,
  consent: FileCheck,
  availability: Clock,
  calendar: Calendar,
  vitrine: Globe,
  waitlist: ListOrdered,
  loyalty: Star,
  messagerie: MessageSquare,
  account: User,
  etablissement: Building2,
};

export function getSettingsTabMeta(
  t: DashboardTranslate
): Record<DashboardSettingsTabId, { label: string; description: string; Icon: LucideIcon }> {
  const ids = Object.keys(SETTINGS_TAB_ICONS) as DashboardSettingsTabId[];
  return ids.reduce(
    (acc, id) => {
      acc[id] = {
        label: t(`dashboard.settings.${id}.label`),
        description: t(`dashboard.settings.${id}.desc`),
        Icon: SETTINGS_TAB_ICONS[id],
      };
      return acc;
    },
    {} as Record<DashboardSettingsTabId, { label: string; description: string; Icon: LucideIcon }>
  );
}

export function getSettingsMainTabs(
  t: DashboardTranslate
): { id: DashboardSettingsTabId; label: string }[] {
  const ids: DashboardSettingsTabId[] = [
    'account',
    'etablissement',
    'general',
    'modules',
    'payments',
    'finance_display',
    'billing',
    'care',
    'consent',
    'availability',
    'calendar',
    'vitrine',
  ];
  return ids.map((id) => ({ id, label: t(`dashboard.settings.${id}.label`) }));
}

export function getMainTabLabel(t: DashboardTranslate, id: string): string {
  const key = `dashboard.tab.${id}`;
  const val = t(key);
  return val === key ? t('dashboard.tab.default') : val;
}

export function getQuickAccessLabel(t: DashboardTranslate, id: QuickAccessItemId): string {
  return t(`dashboard.quickAccess.item.${id}`);
}

export interface TabHeroParams {
  activeTab: DashboardTabId;
  settingsTab: DashboardSettingsTabId;
  settingsTabMeta: ReturnType<typeof getSettingsTabMeta>;
  clientsView: DashboardClientsView;
  financeView: DashboardFinanceView;
  planningView: DashboardPlanningView;
  requestsSubTab: DashboardRequestsSubTab;
  requestsSourceFilter: RequestsSourceFilter | null;
}

export function getTabHeroModel(
  t: DashboardTranslate,
  params: TabHeroParams
): { title: string; description: string } | null {
  const {
    activeTab,
    settingsTab,
    settingsTabMeta,
    clientsView,
    financeView,
    planningView,
    requestsSubTab,
    requestsSourceFilter,
  } = params;

  if (activeTab === 'overview') {
    return {
      title: t('dashboard.hero.overview.title'),
      description: t('dashboard.hero.overview.desc'),
    };
  }

  switch (activeTab) {
    case 'analytics':
      return {
        title: t('dashboard.hero.analytics.title'),
        description: t('dashboard.hero.analytics.desc'),
      };
    case 'requests': {
      const descKey =
        requestsSubTab === 'history'
          ? 'dashboard.hero.requests.history'
          : requestsSourceFilter === 'agenda'
            ? 'dashboard.hero.requests.inboxAgenda'
            : requestsSourceFilter === 'book'
              ? 'dashboard.hero.requests.inboxBook'
              : requestsSourceFilter === 'brief'
                ? 'dashboard.hero.requests.inboxBrief'
                : 'dashboard.hero.requests.inbox';
      return {
        title: t('dashboard.hero.requests.title'),
        description: t(descKey),
      };
    }
    case 'appointments':
      return {
        title: t('dashboard.hero.appointments.title'),
        description: t(
          planningView === 'month'
            ? 'dashboard.hero.appointments.month'
            : 'dashboard.hero.appointments.week'
        ),
      };
    case 'flash':
      return {
        title: t('dashboard.hero.flash.title'),
        description: t('dashboard.hero.flash.desc'),
      };
    case 'clients':
      if (clientsView === 'projects') {
        return {
          title: t('dashboard.hero.clients.projects.title'),
          description: t('dashboard.hero.clients.projects.desc'),
        };
      }
      if (clientsView === 'loyalty') {
        return {
          title: t('dashboard.hero.clients.loyalty.title'),
          description: t('dashboard.hero.clients.loyalty.desc'),
        };
      }
      return {
        title: t('dashboard.hero.clients.overview.title'),
        description: t('dashboard.hero.clients.overview.desc'),
      };
    case 'messaging':
      return {
        title: t('dashboard.hero.messaging.title'),
        description: t('dashboard.hero.messaging.desc'),
      };
    case 'portfolio':
      return {
        title: t('dashboard.hero.portfolio.title'),
        description: t('dashboard.hero.portfolio.desc'),
      };
    case 'stock':
      return {
        title: t('dashboard.hero.stock.title'),
        description: t('dashboard.hero.stock.desc'),
      };
    case 'finance':
      return {
        title: t('dashboard.hero.finance.title'),
        description: t(`dashboard.hero.finance.${financeView}`),
      };
    case 'settings': {
      const meta = settingsTabMeta[settingsTab];
      return { title: meta.label, description: meta.description };
    }
    case 'notifications':
      return {
        title: t('dashboard.hero.notifications.title'),
        description: t('dashboard.hero.notifications.desc'),
      };
    case 'account':
      return {
        title: t('dashboard.hero.account.title'),
        description: t('dashboard.hero.account.desc'),
      };
    case 'etablissement':
      return {
        title: t('dashboard.hero.etablissement.title'),
        description: t('dashboard.hero.etablissement.desc'),
      };
    default:
      return {
        title: getMainTabLabel(t, activeTab),
        description: t('dashboard.hero.default.desc'),
      };
  }
}

export function buildQuickAccessInsightI18n(
  t: DashboardTranslate,
  input: {
    demandes: PendingDemandesCounts;
    todaySessionCount: number;
    lastRecentId: QuickAccessItemId | null;
    flags: QuickAccessModuleFlags;
    hour?: number;
  }
): QuickAccessInsight {
  const hour = input.hour ?? new Date().getHours();
  const lastLabel = input.lastRecentId ? getQuickAccessLabel(t, input.lastRecentId) : undefined;

  if (input.demandes.total > 0) {
    const n = input.demandes.total;
    return {
      id: 'demandes-pending',
      variant: 'alert',
      eyebrow: t('dashboard.quickAccess.insight.pending.eyebrow'),
      title:
        n === 1
          ? t('dashboard.quickAccess.insight.pending.one')
          : t('dashboard.quickAccess.insight.pending.many').replace('{n}', String(n)),
      cta: t('dashboard.quickAccess.insight.pending.cta'),
      targetId: 'requests',
      badge: n,
    };
  }

  if (input.flags.planning && input.todaySessionCount > 0) {
    const n = input.todaySessionCount;
    return {
      id: 'today-sessions',
      variant: 'today',
      eyebrow: t('dashboard.quickAccess.insight.today.eyebrow'),
      title:
        n === 1
          ? t('dashboard.quickAccess.insight.today.one')
          : t('dashboard.quickAccess.insight.today.many').replace('{n}', String(n)),
      cta: t('dashboard.quickAccess.insight.today.cta'),
      targetId: 'agenda',
      badge: n,
    };
  }

  if (hour < 11 && input.flags.planning) {
    return {
      id: 'morning-agenda',
      variant: 'calm',
      eyebrow: t('dashboard.quickAccess.insight.morning.eyebrow'),
      title: t('dashboard.quickAccess.insight.morning.title'),
      cta: t('dashboard.quickAccess.insight.morning.cta'),
      targetId: 'agenda',
    };
  }

  if (hour >= 18 && input.flags.finance) {
    return {
      id: 'evening-finance',
      variant: 'calm',
      eyebrow: t('dashboard.quickAccess.insight.evening.eyebrow'),
      title: t('dashboard.quickAccess.insight.evening.title'),
      cta: t('dashboard.quickAccess.insight.evening.cta'),
      targetId: 'finance',
    };
  }

  if (lastLabel && input.lastRecentId) {
    return {
      id: `resume-${input.lastRecentId}`,
      variant: 'calm',
      eyebrow: t('dashboard.quickAccess.insight.resume.eyebrow'),
      title: lastLabel,
      cta: t('dashboard.quickAccess.insight.resume.cta'),
      targetId: input.lastRecentId,
    };
  }

  return {
    id: 'default-overview',
    variant: 'calm',
    eyebrow: t('dashboard.quickAccess.insight.default.eyebrow'),
    title: t('dashboard.quickAccess.insight.default.title'),
    cta: t('dashboard.quickAccess.insight.default.cta'),
    targetId: 'overview',
  };
}
