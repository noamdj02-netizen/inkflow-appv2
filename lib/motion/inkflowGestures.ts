import { useReducedMotion, type TargetAndTransition, type Transition } from 'framer-motion';

export type InkflowGestureKind = 'tap' | 'tapSoft' | 'card' | 'nav' | 'none';

const GESTURE_TRANSITION: Transition = { duration: 0.12, ease: [0, 0, 0.2, 1] };

export function inkflowGestureTap(reduceMotion: boolean | null): TargetAndTransition | undefined {
  return reduceMotion ? undefined : { scale: 0.98 };
}

export function inkflowGestureTapSoft(
  reduceMotion: boolean | null
): TargetAndTransition | undefined {
  return reduceMotion ? undefined : { scale: 0.97 };
}

export function inkflowGestureCardTap(
  reduceMotion: boolean | null
): TargetAndTransition | undefined {
  return reduceMotion ? undefined : { scale: 0.99 };
}

export function inkflowGestureNavTap(
  reduceMotion: boolean | null
): TargetAndTransition | undefined {
  return reduceMotion ? undefined : { scale: 0.96 };
}

export function inkflowGestureCardHover(
  reduceMotion: boolean | null
): TargetAndTransition | undefined {
  return reduceMotion ? undefined : { y: -2 };
}

export function inkflowGestureTransition(): Transition {
  return GESTURE_TRANSITION;
}

/**
 * Gestes Framer Motion unifiés (dashboard, vitrine, client, landing).
 * Respecte `prefers-reduced-motion`.
 */
export function useInkflowGestures() {
  const reduced = useReducedMotion();

  return {
    reduced: !!reduced,
    transition: inkflowGestureTransition(),
    tap: inkflowGestureTap(reduced),
    tapSoft: inkflowGestureTapSoft(reduced),
    cardTap: inkflowGestureCardTap(reduced),
    navTap: inkflowGestureNavTap(reduced),
    cardHover: inkflowGestureCardHover(reduced),
    /** Alias landing / CTA */
    hover: reduced ? undefined : { scale: 1.02 },
  };
}

export function resolveInkflowGesture(
  kind: InkflowGestureKind,
  gestures: ReturnType<typeof useInkflowGestures>
): { whileTap?: TargetAndTransition; whileHover?: TargetAndTransition } {
  switch (kind) {
    case 'none':
      return {};
    case 'tapSoft':
      return { whileTap: gestures.tapSoft };
    case 'card':
      return { whileTap: gestures.cardTap, whileHover: gestures.cardHover };
    case 'nav':
      return { whileTap: gestures.navTap };
    case 'tap':
    default:
      return { whileTap: gestures.tap, whileHover: gestures.hover };
  }
}
