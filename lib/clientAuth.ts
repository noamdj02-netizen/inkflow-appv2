/**
 * Helpers pour l'espace client (side public, non tatoueur).
 * Pas de logique métier — uniquement des guards sur les métadonnées Supabase.
 */

/** Le client a été créé via magic-link et n'a pas encore défini de mot de passe. */
export function clientNeedsPassword(meta: Record<string, unknown>): boolean {
  return meta?.needs_password_setup === true;
}

/**
 * L'onboarding client est considéré complet si l'une des clés est présente (rétro-compat / métadonnées).
 * L'écran dédié `/client/welcome` n'est plus affiché ; l'app client s'ouvre directement sur le dashboard.
 */
export function clientOnboardingComplete(meta: Record<string, unknown>): boolean {
  return (
    meta?.client_onboarding_complete === true ||
    meta?.onboarding_complete === true ||
    meta?.client_onboarding_done === true
  );
}
