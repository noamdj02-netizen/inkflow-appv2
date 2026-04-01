/**
 * Indique si le studio a enregistré une connexion Stripe (Paramètres → Paiements).
 */
export function isStudioStripeConnected(settingsRaw: unknown): boolean {
  if (settingsRaw == null || typeof settingsRaw !== 'object') return false;
  return (settingsRaw as Record<string, unknown>).stripeConnected === true;
}
