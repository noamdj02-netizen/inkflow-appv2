/**
 * Contexte client Web Push (PWA, iOS) — partagé par les hooks d’abonnement.
 * Sur iOS, `Notification.requestPermission()` hors « user gesture » est souvent ignoré
 * ou n’ouvre pas la boîte de dialogue fiablement ; l’activation doit passer par un bouton
 * (ex. Paramètres → Activer les notifications).
 */

export function isLikelyIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** PWA installée (icône écran d’accueil) — requis sur iOS pour Web Push. */
export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
  const nav = window.navigator as { standalone?: boolean };
  if (nav.standalone === true) return true;
  return false;
}

/**
 * true = ne pas appeler `Notification.requestPermission()` depuis un useEffect
 * (préférer le bouton explicite dans les paramètres).
 */
export function shouldDeferPushPermissionToUserGesture(): boolean {
  return isLikelyIos();
}
