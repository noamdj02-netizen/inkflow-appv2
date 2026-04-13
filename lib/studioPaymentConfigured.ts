/**
 * Indique si le studio peut encaisser les acomptes en ligne.
 * Priorité : colonne `stripe_connect_charges_enabled` (Stripe Connect) ;
 * repli : ancien booléen JSON `stripeConnected` (avant migration Connect).
 */
export function isStudioStripeConnected(
  paymentSettingsRaw: unknown,
  studioStripeChargesEnabled?: boolean | null,
): boolean {
  if (studioStripeChargesEnabled === true) return true;
  if (paymentSettingsRaw == null || typeof paymentSettingsRaw !== 'object') return false;
  return (paymentSettingsRaw as Record<string, unknown>).stripeConnected === true;
}
