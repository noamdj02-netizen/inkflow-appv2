import { useCallback, useEffect, useRef, useState } from 'react';
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

export const LANDING_DEMO_SCENES: LandingDemoScene[] = [
  {
    id: 'overview',
    tab: 'overview',
    title: 'Vue d’ensemble',
    breadcrumb: 'Vue d’ensemble',
    durationMs: 4500,
    expandedMenus: { requests: true },
    notification: { title: 'RDV confirmé — Léa M.', time: 'À l’instant' },
  },
  {
    id: 'requests',
    tab: 'requests',
    title: 'Demandes',
    breadcrumb: 'Demandes / À traiter',
    durationMs: 5200,
    expandedMenus: { requests: true },
    notification: { title: 'Nouvelle demande vitrine — Alice M.', time: 'Il y a 2 min' },
  },
  {
    id: 'appointments',
    tab: 'appointments',
    title: 'Planning',
    breadcrumb: 'Planning / Semaine',
    durationMs: 4200,
    expandedMenus: { planning: true },
    notification: { title: 'Créneau bloqué — 14:00', time: 'Il y a 5 min' },
  },
  {
    id: 'clients',
    tab: 'clients',
    title: 'Clients',
    breadcrumb: 'Clients / Vue d’ensemble',
    durationMs: 4000,
    expandedMenus: { clients: true },
    notification: { title: 'Message client — Tom R.', time: 'Il y a 8 min' },
  },
  {
    id: 'finance',
    tab: 'finance',
    title: 'Finance',
    breadcrumb: 'Finance / Acomptes',
    durationMs: 4200,
    expandedMenus: { finance: true },
    notification: { title: 'Acompte 120 € encaissé — Stripe', time: 'Il y a 12 min' },
  },
];

const DEFAULT_EXPANDED: DashboardExpandedMenus = {
  finance: false,
  planning: false,
  requests: true,
  clients: false,
  vitrine: false,
  settings: false,
};

/** Onglet sidebar → scène démo (agenda = planning). */
export function resolveLandingDemoSceneForTab(tab: DashboardTabId): LandingDemoScene {
  if (tab === 'agenda') {
    return LANDING_DEMO_SCENES.find((s) => s.id === 'appointments') ?? LANDING_DEMO_SCENES[0]!;
  }
  return LANDING_DEMO_SCENES.find((s) => s.tab === tab) ?? LANDING_DEMO_SCENES[0]!;
}

export function useLandingDashboardDemoPlayback() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<DashboardTabId>('overview');
  const [expandedMenus, setExpandedMenus] = useState<DashboardExpandedMenus>(DEFAULT_EXPANDED);
  const [toastQueue, setToastQueue] = useState<string[]>([]);
  const [bellPulse, setBellPulse] = useState(false);
  const pausedRef = useRef(false);

  const scene = LANDING_DEMO_SCENES[sceneIndex] ?? LANDING_DEMO_SCENES[0];

  const applyScene = useCallback((index: number) => {
    const next = LANDING_DEMO_SCENES[index];
    if (!next) return;

    setSceneIndex(index);
    setActiveTab(next.tab);
    setExpandedMenus((prev) => ({ ...prev, ...next.expandedMenus }));

    if (next.notification) {
      setToastQueue((q) => [next.notification!.title, ...q].slice(0, 4));
      setBellPulse(true);
      window.setTimeout(() => setBellPulse(false), 700);
    }
  }, []);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) return;

    const timer = window.setTimeout(() => {
      if (pausedRef.current) return;
      const nextIndex = (sceneIndex + 1) % LANDING_DEMO_SCENES.length;
      applyScene(nextIndex);
    }, scene.durationMs);

    return () => window.clearTimeout(timer);
  }, [sceneIndex, scene.durationMs, applyScene]);

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
  };
}
