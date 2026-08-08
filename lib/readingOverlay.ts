/** Masque la topbar dashboard sur mobile quand un panneau de lecture (fiche, aperçu) est ouvert. */
const ATTR = 'data-inkflow-reading-overlay';

let depth = 0;

export function setReadingOverlayActive(active: boolean): void {
  if (typeof document === 'undefined') return;
  depth = Math.max(0, depth + (active ? 1 : -1));
  if (depth > 0) {
    document.documentElement.setAttribute(ATTR, 'true');
  } else {
    document.documentElement.removeAttribute(ATTR);
  }
}
