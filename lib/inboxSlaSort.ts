/** Tri inbox : plus ancien en premier (SLA — à traiter en priorité). */
export function sortInboxBySla<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/** Heures depuis création — badge urgence. */
export function inboxPendingAgeHours(createdAt: string): number {
  const ms = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(ms / (60 * 60 * 1000)));
}

export function inboxSlaUrgencyLabel(createdAt: string): string | null {
  const h = inboxPendingAgeHours(createdAt);
  if (h >= 48) return '48 h+';
  if (h >= 24) return '24 h+';
  if (h >= 12) return '12 h+';
  return null;
}
