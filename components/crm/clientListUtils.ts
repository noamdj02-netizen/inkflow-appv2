/**
 * Fonctions utilitaires pour ClientList — extraites pour allèger le composant principal.
 */
import type { ProjectRequest, ProjectRequestStatus } from '../../types';

export function projectStatusMeta(status: ProjectRequestStatus): { label: string; className: string } {
  switch (status) {
    case 'pending':
      return {
        label: 'En attente',
        className: 'bg-zinc-200/90 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200',
      };
    case 'accepted':
      return {
        label: 'Acceptée',
        className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
      };
    case 'rejected':
      return {
        label: 'Refusée',
        className: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-500',
      };
    default:
      return { label: status, className: 'bg-zinc-100 text-zinc-600' };
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

export function getClientStatusColor(status: string): string {
  switch (status) {
    case 'vip':
    case 'active':
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30';
    case 'inactive':
    default:
      return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
  }
}
