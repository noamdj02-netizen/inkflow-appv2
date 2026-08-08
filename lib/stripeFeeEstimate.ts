/**
 * Estimation frais Stripe Connect (cartes EU ~1,5 % + 0,25 €).
 * `inkflow_payments` ne stocke pas encore le fee réel — affichage indicatif dashboard.
 */
export function estimateStripeFeeEur(grossEur: number): number {
  if (!Number.isFinite(grossEur) || grossEur <= 0) return 0;
  return Math.round((grossEur * 0.015 + 0.25) * 100) / 100;
}

export function estimateStripeFeesBatch(amountsEur: readonly number[]): number {
  return amountsEur.reduce((sum, amount) => sum + estimateStripeFeeEur(amount), 0);
}
