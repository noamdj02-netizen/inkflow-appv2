import { useSyncExternalStore } from 'react';

/** Breakpoint Tailwind `md` (768px). */
export const MOBILE_MAX_WIDTH_PX = 767;

function subscribe(query: string, cb: () => void) {
  const mql = window.matchMedia(query);
  mql.addEventListener('change', cb);
  return () => mql.removeEventListener('change', cb);
}

function getSnapshot(query: string) {
  return () => window.matchMedia(query).matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * Suit `matchMedia` — SSR-safe (`false` au premier rendu serveur).
 * Aligné breakpoints Tailwind : md 768, lg 1024, xl 1280.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore((cb) => subscribe(query, cb), getSnapshot(query), getServerSnapshot);
}

/** Breakpoint Tailwind `md` (768px) — layout dashboard, héros, listes tactiles. */
export function useBreakpointMd(): boolean {
  return useMediaQuery('(min-width: 768px)');
}

/** Viewport mobile (< md). */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`);
}
