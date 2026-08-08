/**
 * Heuristique alignée sur RequestsDashboard (flash / pré-dessiné).
 */
export function isFlashBookingDescription(description: string | null | undefined): boolean {
  const d = (description ?? '').toLowerCase();
  return d.includes('flash') || d.includes('pré-dessiné') || d.includes('prédessiné');
}
