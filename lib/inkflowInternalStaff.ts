/**
 * Comptes équipe InkFlow (fondateur / support) : pas de studio tatoueur à provisioning.
 * - Domaines officiels : @ink-flow.me (marketing / contact), @inkflow.me (raccourci éventuel)
 * - Ou e-mail listé dans VITE_FOUNDER_ADMIN_EMAILS (même logique que /admin côté client)
 */
const INKFLOW_TEAM_DOMAINS = ['@ink-flow.me', '@inkflow.me'] as const;

function viteFounderEmailSet(): Set<string> {
  const raw = (import.meta.env.VITE_FOUNDER_ADMIN_EMAILS as string | undefined) ?? '';
  return new Set(raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
}

export function isInkflowInternalStaffEmail(email: string | null | undefined): boolean {
  const e = email?.trim().toLowerCase();
  if (!e) return false;
  if (INKFLOW_TEAM_DOMAINS.some((d) => e.endsWith(d))) return true;
  return viteFounderEmailSet().has(e);
}
