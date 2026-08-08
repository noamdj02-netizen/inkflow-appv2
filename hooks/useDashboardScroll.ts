import { useCallback, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

/** Attribut sur `.app-shell-content` — scroll natif dashboard (hors Lenis). */
export const DASHBOARD_SCROLL_ROOT_ATTR = 'data-dashboard-scroll-root';

export function useDashboardScroll() {
  const contentRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const scrollToTop = useCallback(
    (behavior?: ScrollBehavior) => {
      const el = contentRef.current;
      if (!el) return;
      el.scrollTo({
        top: 0,
        left: 0,
        behavior: behavior ?? (reduceMotion ? 'auto' : 'smooth'),
      });
    },
    [reduceMotion]
  );

  return { contentRef, scrollToTop };
}

/** Pour composants hors DashboardPro (Agenda, etc.). */
export function getDashboardScrollRoot(): HTMLElement | null {
  return document.querySelector(`[${DASHBOARD_SCROLL_ROOT_ATTR}]`);
}
