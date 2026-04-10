import { useMemo } from 'react';
import type { Appointment, Booking, ProjectRequest } from '../types';

export interface PendingDemandesCounts {
  /** RDV agenda en statut pending */
  pendingRdv: number;
  /** Demandes depuis la vitrine / formulaire public (inkflow_bookings) */
  pendingVitrine: number;
  /** Demandes de projet custom (inkflow_project_requests) */
  pendingProjects: number;
  /** Total pour pastilles header / sidebar */
  total: number;
}

/**
 * Compte toutes les demandes « action requise » : RDV + vitrine + projets.
 * À utiliser pour les pastilles Dashboard (pas seulement les projets).
 */
export function usePendingDemandesCounts(
  appointments: Appointment[],
  bookings: Booking[],
  projectRequests: ProjectRequest[]
): PendingDemandesCounts {
  return useMemo(() => {
    const pendingRdv = appointments.filter((a) => a.status === 'pending').length;
    const pendingVitrine = bookings.filter((b) => b.status === 'pending').length;
    const pendingProjects = projectRequests.filter((p) => p.status === 'pending').length;
    return {
      pendingRdv,
      pendingVitrine,
      pendingProjects,
      total: pendingRdv + pendingVitrine + pendingProjects,
    };
  }, [appointments, bookings, projectRequests]);
}
