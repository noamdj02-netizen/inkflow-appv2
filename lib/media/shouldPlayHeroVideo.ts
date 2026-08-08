/** Network Information API (Chromium / some Android browsers). */
interface NetworkInformationLike {
  effectiveType?: string;
  saveData?: boolean;
}

const SLOW_EFFECTIVE_TYPES = new Set(['slow-2g', '2g', '3g']);

/** Mobile viewport — below Tailwind `md` (768px). */
export function isHeroVideoMobileViewport(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(max-width: 767px)').matches;
}

/** Connexion lente ou mode économie de data — pas de vidéo hero. */
export function isHeroVideoSlowConnection(): boolean {
  if (typeof navigator === 'undefined') return false;
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  if (!connection) return false;
  if (connection.saveData) return true;
  if (connection.effectiveType && SLOW_EFFECTIVE_TYPES.has(connection.effectiveType)) {
    return true;
  }
  return false;
}

/** Autoplay vidéo hero autorisé (desktop/tablet ≥768px, connexion OK, motion OK). */
export function shouldPlayHeroVideo(
  reduceMotion: boolean | null,
  isMobileViewport: boolean
): boolean {
  if (reduceMotion) return false;
  if (isMobileViewport) return false;
  if (isHeroVideoSlowConnection()) return false;
  return true;
}
