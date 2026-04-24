/**
 * Feedback haptique léger (Web Vibration API). No-op si indisponible ou préférence "réduire les animations".
 */
function canVibrate(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;
  try {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return false;
  } catch {
    /* ignore */
  }
  return true;
}

/** Confirmation courte (succès, validation) */
export function hapticSuccess(): void {
  if (!canVibrate()) return;
  navigator.vibrate(12);
}

/** Attention / avertissement */
export function hapticWarning(): void {
  if (!canVibrate()) return;
  navigator.vibrate([10, 40, 10]);
}

/** Rejet / suppression validée (légèrement plus marqué) */
export function hapticDestructiveDone(): void {
  if (!canVibrate()) return;
  navigator.vibrate([15, 50, 15]);
}
