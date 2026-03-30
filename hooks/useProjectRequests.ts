import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { getProjectRequestsFromSupabase, updateProjectRequestStatus as updateStatusInSupabase, mapProjectRequestFromDb } from '../lib/supabaseDashboard';
import { useOptimisticMutation } from './useOptimisticMutation';
import { useRealtimeSync } from './useRealtimeSync';
import type { ProjectRequest, ProjectRequestStatus } from '../types';

export function useProjectRequests(studioId: string | null) {
  const toast = useToast();
  const [projectRequests, setProjectRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const supabaseEnabled = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  // Delta-based realtime instead of refetch-all
  useRealtimeSync(
    'inkflow_project_requests',
    { column: 'studio_id', value: studioId },
    setProjectRequests,
    mapProjectRequestFromDb,
    supabaseEnabled
  );

  // Optimistic mutations with rollback
  const mutation = useOptimisticMutation(setProjectRequests, toast);

  const load = useCallback(async () => {
    if (!studioId) {
      setProjectRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getProjectRequestsFromSupabase(studioId);
      setProjectRequests(data);
    } catch (err) {
      console.error('[useProjectRequests] load error:', err);
      toast.error('Impossible de charger les demandes de projet');
      setProjectRequests([]);
    } finally {
      setLoading(false);
    }
  }, [studioId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = useCallback(async (id: string, status: ProjectRequestStatus) => {
    const p = mutation.update(
      id,
      (req) => ({ ...req, status }),
      async () => {
        await updateStatusInSupabase(id, status);
        if (studioId) await load();
      }
    );
    if (p) await p;
  }, [mutation, studioId, load]);

  return { projectRequests, loading, updateStatus, refetch: load };
}
