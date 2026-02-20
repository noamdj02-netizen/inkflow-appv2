import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { getProjectRequestsFromSupabase, updateProjectRequestStatus as updateStatusInSupabase, mapProjectRequestFromDb } from '../lib/supabaseDashboard';
import { useOptimisticMutation } from './useOptimisticMutation';
import { useRealtimeSync } from './useRealtimeSync';
import { DEMO_ACCOUNT_EMAILS, getDemoProjectRequests } from '../data/demoData';
import type { ProjectRequest, ProjectRequestStatus } from '../types';

function isDemoUser(): boolean {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('inkflow_user') : null;
    if (!raw) return false;
    const u = JSON.parse(raw) as { email?: string };
    return DEMO_ACCOUNT_EMAILS.includes(u?.email?.toLowerCase().trim() ?? '');
  } catch {
    return false;
  }
}

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
      if (isDemoUser()) {
        setProjectRequests(getDemoProjectRequests());
      } else {
        setProjectRequests([]);
      }
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getProjectRequestsFromSupabase(studioId);
      setProjectRequests(data);
    } catch (e) {
      if (import.meta.env.DEV) console.error('useProjectRequests load:', e);
      setProjectRequests([]);
    } finally {
      setLoading(false);
    }
  }, [studioId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = useCallback(async (id: string, status: ProjectRequestStatus) => {
    mutation.update(
      id,
      (req) => ({ ...req, status }),
      () => updateStatusInSupabase(id, status)
    );
  }, [mutation]);

  return { projectRequests, loading, updateStatus };
}
