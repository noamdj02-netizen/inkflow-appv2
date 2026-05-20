/**
 * Utilitaires ClientList — badges pastels, pas de fonds alternés.
 */
import type { ProjectRequest, ProjectRequestStatus } from '../../types';
import {
  inkBadgeError,
  inkBadgeNeutral,
  inkBadgePrimary,
  inkBadgeSuccess,
} from '@/lib/inkDesignTokens';

export function projectStatusMeta(status: ProjectRequestStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'pending':
      return { label: 'En attente', className: inkBadgeNeutral };
    case 'accepted':
      return { label: 'Acceptée', className: inkBadgeSuccess };
    case 'rejected':
      return { label: 'Refusée', className: inkBadgeError };
    default:
      return { label: status, className: inkBadgeNeutral };
  }
}

export function groupProjectRequestsByClient(requests: ProjectRequest[]): Array<{
  clientEmail: string;
  clientName: string;
  requests: ProjectRequest[];
}> {
  const map = new Map<string, ProjectRequest[]>();
  for (const r of requests) {
    const key = r.clientEmail.trim().toLowerCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  const groups = Array.from(map.entries()).map(([emailKey, reqs]) => ({
    clientEmail: reqs[0]?.clientEmail ?? emailKey,
    clientName: reqs[0]?.clientName ?? '—',
    requests: reqs,
  }));
  groups.sort((a, b) => {
    const ta = Math.max(0, ...a.requests.map((x) => new Date(x.createdAt).getTime()));
    const tb = Math.max(0, ...b.requests.map((x) => new Date(x.createdAt).getTime()));
    return tb - ta;
  });
  return groups;
}

/** Badge statut client — fond pastel (opacité), radius 8px */
export function getClientStatusColor(status: string): string {
  switch (status) {
    case 'vip':
      return inkBadgePrimary;
    case 'active':
      return inkBadgeSuccess;
    case 'inactive':
    default:
      return inkBadgeNeutral;
  }
}

/** @deprecated Liste unifiée par bordure — plus d’accent border-l */
export function getClientCardLeftAccent(_status: string): string {
  return '';
}
