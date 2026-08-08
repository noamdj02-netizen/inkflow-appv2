import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type {
  DashboardExpandedMenus,
  DashboardTabId,
} from '@/components/dashboard/dashboardProNavShared';

export type LandingDemoSceneId = 'overview' | 'requests' | 'appointments' | 'clients' | 'finance';

export type LandingDemoScene = {
  id: LandingDemoSceneId;
  tab: DashboardTabId;
  title: string;
  breadcrumb: string;
  durationMs: number;
  expandedMenus: Partial<DashboardExpandedMenus>;
  notification?: {
    title: string;
    time: string;
  };
};

const SCENE_DEFS: Array<{
  id: LandingDemoSceneId;
  tab: DashboardTabId;
  durationMs: number;
  expandedMenus: Partial<DashboardExpandedMenus>;
  titleKey: string;
  breadcrumbKey: string;
  notifTitleKey: string;
  notifTimeKey: string;
}> = [
  {
    id: 'overview',
    tab: 'overview',
    durationMs: 4500,
    expandedMenus: { requests: true },
    titleKey: 'demo.scene.overview.title',
    breadcrumbKey: 'demo.scene.overview.breadcrumb',
    notifTitleKey: 'demo.scene.overview.notif',
    notifTimeKey: 'demo.scene.overview.time',
  },
  {
    id: 'requests',
    tab: 'requests',
    durationMs: 5200,
    expandedMenus: { requests: true },
    titleKey: 'demo.scene.requests.title',
    breadcrumbKey: 'demo.scene.requests.breadcrumb',
    notifTitleKey: 'demo.scene.requests.notif',
    notifTimeKey: 'demo.scene.requests.time',
  },
  {
    id: 'appointments',
    tab: 'appointments',
    durationMs: 4200,
    expandedMenus: { planning: true },
    titleKey: 'demo.scene.appointments.title',
    breadcrumbKey: 'demo.scene.appointments.breadcrumb',
    notifTitleKey: 'demo.scene.appointments.notif',
    notifTimeKey: 'demo.scene.appointments.time',
  },
  {
    id: 'clients',
    tab: 'clients',
    durationMs: 4000,
    expandedMenus: { clients: true },
    titleKey: 'demo.scene.clients.title',
    breadcrumbKey: 'demo.scene.clients.breadcrumb',
    notifTitleKey: 'demo.scene.clients.notif',
    notifTimeKey: 'demo.scene.clients.time',
  },
  {
    id: 'finance',
    tab: 'finance',
    durationMs: 4200,
    expandedMenus: { finance: true },
    titleKey: 'demo.scene.finance.title',
    breadcrumbKey: 'demo.scene.finance.breadcrumb',
    notifTitleKey: 'demo.scene.finance.notif',
    notifTimeKey: 'demo.scene.finance.time',
  },
];

export function buildLandingDemoScenes(t: (key: string) => string): LandingDemoScene[] {
  return SCENE_DEFS.map((def) => ({
    id: def.id,
    tab: def.tab,
    durationMs: def.durationMs,
    expandedMenus: def.expandedMenus,
    title: t(def.titleKey),
    breadcrumb: t(def.breadcrumbKey),
    notification: {
      title: t(def.notifTitleKey),
      time: t(def.notifTimeKey),
    },
  }));
}

const DEFAULT_EXPANDED: DashboardExpandedMenus = {
  finance: false,
  planning: false,
  requests: true,
  clients: false,
  vitrine: false,
  settings: false,
};

/** Onglet sidebar → scène démo (agenda = planning). */
export function resolveLandingDemoSceneForTab(
  tab: DashboardTabId,
  scenes: LandingDemoScene[]
): LandingDemoScene {
  if (tab === 'agenda') {
    return scenes.find((s) => s.id === 'appointments') ?? scenes[0]!;
  }
  return scenes.find((s) => s.tab === tab) ?? scenes[0]!;
}

export function useLandingDashboardDemoPlayback() {
  const { t, lang } = useLanguage();
  const scenes = useMemo(() => buildLandingDemoScenes(t), [t]);

  const [sceneIndex, setSceneIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<DashboardTabId>('overview');
  const [expandedMenus, setExpandedMenus] = useState<DashboardExpandedMenus>(DEFAULT_EXPANDED);
  const [toastQueue, setToastQueue] = useState<string[]>([]);
  const [bellPulse, setBellPulse] = useState(false);
  const pausedRef = useRef(false);

  const scene = scenes[sceneIndex] ?? scenes[0]!;

  useEffect(() => {
    setSceneIndex(0);
    setActiveTab('overview');
    setToastQueue([]);
  }, [lang]);

  const applyScene = useCallback(
    (index: number) => {
      const next = scenes[index];
      if (!next) return;

      setSceneIndex(index);
      setActiveTab(next.tab);
      setExpandedMenus((prev) => ({ ...prev, ...next.expandedMenus }));

      if (next.notification) {
        setToastQueue((q) => [next.notification!.title, ...q].slice(0, 4));
        setBellPulse(true);
        window.setTimeout(() => setBellPulse(false), 700);
      }
    },
    [scenes]
  );

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) return;

    const timer = window.setTimeout(() => {
      if (pausedRef.current) return;
      const nextIndex = (sceneIndex + 1) % scenes.length;
      applyScene(nextIndex);
    }, scene.durationMs);

    return () => window.clearTimeout(timer);
  }, [sceneIndex, scene.durationMs, applyScene, scenes.length]);

  const pause = useCallback(() => {
    pausedRef.current = true;
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
  }, []);

  return {
    scene,
    sceneIndex,
    activeTab,
    setActiveTab,
    expandedMenus,
    setExpandedMenus,
    toastQueue,
    bellPulse,
    pause,
    resume,
    applyScene,
    scenes,
  };
}
