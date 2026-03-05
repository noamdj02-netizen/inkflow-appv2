/**
 * Pastille de notification sur l'icône PWA (iOS/Android, Chrome, Safari).
 * Utilise la Badging API (navigator.setAppBadge / clearAppBadge).
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Badging_API
 */

declare global {
  interface Navigator {
    setAppBadge?(contents?: number): Promise<void>;
    clearAppBadge?(): Promise<void>;
  }
}

function isBadgingSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.setAppBadge === 'function';
}

/**
 * Met à jour la pastille sur l'icône de l'app.
 * @param count Nombre de notifications non lues. 0 = efface la pastille.
 */
export async function updateAppBadge(count: number): Promise<void> {
  if (!isBadgingSupported()) return;
  try {
    if (count <= 0) {
      if (typeof navigator.clearAppBadge === 'function') {
        await navigator.clearAppBadge();
      } else {
        await navigator.setAppBadge!(0);
      }
    } else {
      await navigator.setAppBadge!(Math.min(count, 99));
    }
  } catch {
    // Ignore (navigateur ne supporte pas, contexte non sécurisé, etc.)
  }
}
