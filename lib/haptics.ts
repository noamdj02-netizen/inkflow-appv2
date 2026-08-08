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

function postInkflowNativeMessage(type: string): boolean {
  if (typeof window === 'undefined') return false;
  const bridge = (
    window as Window & { ReactNativeWebView?: { postMessage: (payload: string) => void } }
  ).ReactNativeWebView;
  if (!bridge?.postMessage) return false;
  try {
    bridge.postMessage(JSON.stringify({ type }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Sélection / navigation (onglets) — enveloppe native Expo si dispo, sinon Vibration API.
 */
export function hapticTabChange(): void {
  if (postInkflowNativeMessage('inkflow_haptic_selection')) return;
  if (!canVibrate()) return;
  navigator.vibrate(8);
}

export function hapticSuccessNative(): void {
  if (postInkflowNativeMessage('inkflow_haptic_success')) return;
  hapticSuccess();
}

export function hapticWarningNative(): void {
  if (postInkflowNativeMessage('inkflow_haptic_warning')) return;
  hapticWarning();
}
