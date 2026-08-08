/**
 * URL allégée pour la bannière mobile du dashboard (évite les covers vitrine full-res).
 */
export function optimizeDashboardHeroImageUrl(
  url: string | null | undefined,
  width = 720
): string | null {
  const raw = url?.trim();
  if (!raw) return null;

  if (raw.includes('/storage/v1/render/image/')) {
    return raw;
  }

  if (raw.includes('/storage/v1/object/public/')) {
    const base = raw.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}width=${width}&quality=72&resize=cover`;
  }

  return raw;
}
