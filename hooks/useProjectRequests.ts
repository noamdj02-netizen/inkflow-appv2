import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import {
  getProjectRequestsFromSupabase,
  updateProjectRequestStatus as updateStatusInSupabase,
  mapProjectRequestFromDb,
} from '../lib/supabaseDashboard';
import { getInkflowDemoProProjectRequests } from '../lib/inkflowDemoAccountData';
import { useOptimisticMutation } from './useOptimisticMutation';
import { useRealtimeSync } from './useRealtimeSync';
import type { ProjectRequest, ProjectRequestStatus } from '../types';

export function useProjectRequests(studioId: string | null, options?: { demoMode?: boolean }) {
  const demoMode = options?.demoMode ?? false;
  const toast = useToast();
  const [projectRequests, setProjectRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const supabaseEnabled = !!(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  // Delta-based realtime instead of refetch-all
  useRealtimeSync(
    'inkflow_project_requests',
    { column: 'studio_id', value: studioId },
    setProjectRequests,
    mapProjectRequestFromDb,
    supabaseEnabled && !demoMode
  );

  // Optimistic mutations with rollback
  const mutation = useOptimisticMutation(setProjectRequests, toast);

  const load = useCallback(async () => {
    if (!studioId) {
      setProjectRequests([]);
      setLoadError(null);
      setLoading(false);
      return;
    }
    if (demoMode) {
      setProjectRequests(getInkflowDemoProProjectRequests(studioId));
      setLoadError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getProjectRequestsFromSupabase(studioId);
      setProjectRequests(data);
    } catch (err) {
      console.error('[useProjectRequests] load error:', err);
      const msg =
        err instanceof Error ? err.message : 'Impossible de charger les demandes de projet';
      setLoadError(msg);
      setProjectRequests([]);
    } finally {
      setLoading(false);
    }
  }, [studioId, demoMode]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && studioId && supabaseEnabled && !demoMode)
        load();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [studioId, supabaseEnabled, load, demoMode]);

  const updateStatus = useCallback(
    async (id: string, status: ProjectRequestStatus) => {
      if (!studioId) return;
      mutation.update(
        id,
        (req) => ({ ...req, status }),
        async () => {
          if (demoMode) return;
          await updateStatusInSupabase(id, status, studioId);
          load();
        }
      );
    },
    [mutation, studioId, load, demoMode]
  );

  return { projectRequests, loading, loadError, updateStatus, refetch: load };
}
