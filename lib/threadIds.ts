/**
 * Fils messagerie : `thread_id` = id complet de la demande (`pr_*`, `bk_*`).
 * Anciens liens pouvaient dupliquer le préfixe (`/messages/pr_pr_…`) — on normalise.
 */
export function normalizePublicMessageThreadId(raw: string): string {
  let t = raw.trim();
  if (t.startsWith('pr_pr_')) t = t.slice(3);
  if (t.startsWith('bk_bk_')) t = t.slice(3);
  return t;
}
