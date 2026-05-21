import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildQuickAccessInsight,
  filterQuickAccessIds,
  loadQuickAccessState,
  quickAccessStorageKey,
  recordQuickAccessVisit,
  saveQuickAccessState,
  toggleQuickAccessPin,
  type QuickAccessInsight,
  type QuickAccessItemId,
  type QuickAccessModuleFlags,
  type QuickAccessPersisted,
} from '../lib/dashboardQuickAccess';
import type { PendingDemandesCounts } from './usePendingDemandesCounts';

const TAB_TO_QUICK_ID: Partial<Record<string, QuickAccessItemId>> = {
  overview: 'overview',
  analytics: 'analytics',
  requests: 'requests',
  agenda: 'agenda',
  appointments: 'appointments',
  clients: 'clients',
  finance: 'finance',
  messaging: 'messaging',
  settings: 'settings',
  stock: 'overview',
  flash: 'overview',
  portfolio: 'overview',
  notifications: 'settings',
  account: 'settings',
  etablissement: 'settings',
};

export function useDashboardQuickAccess(options: {
  studioId: string | undefined;
  userId: string | undefined;
  activeTab: string;
  demandes: PendingDemandesCounts;
  todaySessionCount: number;
  moduleFlags: QuickAccessModuleFlags;
}) {
  const storageKey = quickAccessStorageKey(options.studioId, options.userId);
  const [state, setState] = useState<QuickAccessPersisted>(() => loadQuickAccessState(storageKey));

  useEffect(() => {
    setState(loadQuickAccessState(storageKey));
  }, [storageKey]);

  const persist = useCallback(
    (next: QuickAccessPersisted) => {
      setState(next);
      saveQuickAccessState(storageKey, next);
    },
    [storageKey]
  );

  const activeQuickId = TAB_TO_QUICK_ID[options.activeTab] ?? null;

  useEffect(() => {
    if (!activeQuickId) return;
    setState((prev) => {
      if (prev.recents[0]?.id === activeQuickId) return prev;
      const next = recordQuickAccessVisit(prev, activeQuickId);
      saveQuickAccessState(storageKey, next);
      return next;
    });
  }, [activeQuickId, storageKey]);

  const pins = useMemo(
    () => filterQuickAccessIds(state.pins, options.moduleFlags),
    [state.pins, options.moduleFlags]
  );

  const recents = useMemo(
    () =>
      filterQuickAccessIds(
        state.recents.map((r) => r.id),
        options.moduleFlags
      ).filter((id) => !pins.includes(id)),
    [state.recents, options.moduleFlags, pins]
  );

  const insight: QuickAccessInsight = useMemo(
    () =>
      buildQuickAccessInsight({
        demandes: options.demandes,
        todaySessionCount: options.todaySessionCount,
        lastRecentId: recents[0] ?? pins[0] ?? null,
        flags: options.moduleFlags,
      }),
    [options.demandes, options.todaySessionCount, recents, pins, options.moduleFlags]
  );

  const togglePin = useCallback(
    (id: QuickAccessItemId) => {
      const result = toggleQuickAccessPin(state, id, options.moduleFlags);
      if (result.state !== state) persist(result.state);
      return result;
    },
    [state, options.moduleFlags, persist]
  );

  return {
    pins,
    recents,
    insight,
    togglePin,
    activeQuickId,
  };
}
