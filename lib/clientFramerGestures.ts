import { useInkflowGestures } from '@/lib/motion/inkflowGestures';

/**
 * @deprecated Préférer `useInkflowGestures` — alias conservé pour vitrine / client / discover.
 */
export function useClientFramerGestures() {
  const g = useInkflowGestures();
  return {
    reduced: g.reduced,
    tap: g.tap,
    tapSoft: g.tapSoft,
    cardTap: g.cardTap,
    cardHover: g.cardHover,
  };
}
