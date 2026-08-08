import { useState, useEffect, useCallback } from 'react';
import { getWidgetsFromSupabase, saveWidgetsToSupabase } from '../lib/supabaseDashboard';
import type { DashboardWidget } from '../components/dashboard/DashboardWidgets';

const STORAGE_KEY = 'inkflow-dashboard-widgets';

export function useDashboardWidgets(
  studioId: string | null,
  useSupabase: boolean,
  options?: { onError?: (err: Error) => void }
) {
  const onWidgetSaveError = options?.onError;
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as DashboardWidget[];
    } catch {
      /* ignore */
    }
    return [];
  });
  useEffect(() => {
    if (!studioId || !useSupabase) return;
    getWidgetsFromSupabase(studioId)
      .then((fromDb) => {
        if (fromDb.length > 0) {
          setWidgets(fromDb);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fromDb));
        }
      })
      .catch(() => {});
  }, [studioId, useSupabase]);

  const setWidgetsAndSave = useCallback(
    (next: DashboardWidget[] | ((prev: DashboardWidget[]) => DashboardWidget[])) => {
      setWidgets((prev) => {
        const nextVal = typeof next === 'function' ? next(prev) : next;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextVal));
        if (studioId && useSupabase) {
          saveWidgetsToSupabase(studioId, nextVal).catch((err: Error) => {
            onWidgetSaveError?.(err);
          });
        }
        return nextVal;
      });
    },
    [studioId, useSupabase, onWidgetSaveError]
  );

  return [widgets, setWidgetsAndSave] as const;
}
