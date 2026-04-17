/**
 * Détecte les médias / textes issus de l’ancien gabarit vitrine (démo marketing)
 * pour ne pas les afficher à la place des vraies données studio (page publique + OG).
 */

/** Ancien nom marketing du template (avant personnalisation). */
export const LEGACY_VITRINE_NAME = 'Ink & Art Studio';

/** IDs Unsplash utilisés uniquement dans l’ancien defaultVitrineData (hors démo locale). */
const LEGACY_UNSPLASH_PHOTO_IDS = new Set([
  '1598371839696',
  '1590246814883',
  '1611501275019',
  '1494790108377',
  '1507003211169',
]);

export function isTemplateStockImageUrl(url: string | null | undefined): boolean {
  const u = (url || '').trim();
  if (!u) return false;
  const lower = u.toLowerCase();
  if (lower.includes('api.dicebear.com')) return true;
  if (lower.includes('/images/avatar-studio.png') || lower.includes('/images/cover-studio.png')) return true;
  if (!lower.includes('unsplash.com')) return false;
  for (const id of LEGACY_UNSPLASH_PHOTO_IDS) {
    if (u.includes(id)) return true;
  }
  return false;
}

export function isLegacyTemplateFingerprintStats(data: {
  rating: number;
  reviewCount: number;
  totalTattoos: number;
  satisfactionRate: number;
  repeatClients: number;
  yearsExperience: number;
}): boolean {
  return (
    data.rating === 4.9 &&
    data.reviewCount === 127 &&
    data.totalTattoos === 2500 &&
    data.satisfactionRate === 98 &&
    data.repeatClients === 85 &&
    data.yearsExperience === 9
  );
}
