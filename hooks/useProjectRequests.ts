import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getProjectRequestsFromSupabase, updateProjectRequestStatus as updateStatusInSupabase } from '../lib/supabaseDashboard';
import type { ProjectRequest, ProjectRequestStatus } from '../types';

export function useProjectRequests(studioId: string | null) {
  const [projectRequests, setProjectRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch (e) {
      console.error('useProjectRequests load:', e);
      setProjectRequests([]);
    } finally {
      setLoading(false);
    }
  }, [studioId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!studioId) return;
    const channel = supabase
      .channel('project_requests')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inkflow_project_requests', filter: `studio_id=eq.${studioId}` },
        () => load()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'inkflow_project_requests', filter: `studio_id=eq.${studioId}` },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studioId, load]);

  const updateStatus = useCallback(async (id: string, status: ProjectRequestStatus) => {
    await updateStatusInSupabase(id, status);
    setProjectRequests((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }, []);

  return { projectRequests, loading, updateStatus };
}
