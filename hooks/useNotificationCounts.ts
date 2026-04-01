import { useMemo } from 'react';
import type { ProjectRequest } from '../types';

/**
 * Compte les demandes de projet en attente (PENDING) à partir de la liste déjà chargée.
 * Ne pas appeler useProjectRequests ici : le parent doit fournir projectRequests pour éviter
 * un double abonnement Realtime et des incohérences de hooks.
 */
export function usePendingProjectRequestsCount(projectRequests: ProjectRequest[]): number {
  return useMemo(
    () => projectRequests.filter((p) => p.status === 'pending').length,
    [projectRequests]
  );
}
