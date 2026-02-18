import { useMemo } from 'react';
import { useProjectRequests } from './useProjectRequests';

/**
 * Hook pour les pastilles de notification (demandes de projet en attente).
 * S'appuie sur useProjectRequests + Supabase Realtime : le chiffre se met à jour
 * instantanément quand une nouvelle demande arrive ou change de statut.
 */
export function useNotificationCounts(studioId: string | null) {
  const { projectRequests, loading } = useProjectRequests(studioId);

  const pendingRequestsCount = useMemo(
    () => projectRequests.filter((p) => p.status === 'PENDING').length,
    [projectRequests]
  );

  return { pendingRequestsCount, loading };
}
