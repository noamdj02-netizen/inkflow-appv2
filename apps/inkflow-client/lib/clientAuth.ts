/** Même logique que `lib/clientAuth.ts` (web). */

export function clientNeedsPassword(meta: Record<string, unknown>): boolean {
  return meta.client_password_set !== true;
}

export function clientOnboardingComplete(meta: Record<string, unknown>): boolean {
  if (meta.client_onboarding_complete === true) return true;
  const n = meta.name;
  return typeof n === 'string' && n.trim().length > 0;
}
