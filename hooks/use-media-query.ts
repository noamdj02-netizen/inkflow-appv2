import { useSyncExternalStore } from 'react';

function subscribe(query: string, cb: () => void) {
  const mql = window.matchMedia(query);
  mql.addEventListener('change', cb);
  return () => mql.removeEventListener('change', cb);
}

function snapshot(query: string) {
  return () => window.matchMedia(query).matches;
}

/**
 * Suit `matchMedia` de façon SSR-safe (toujours `false` en premier rendu serveur).
 * Aligné sur les breakpoints Tailwind : `md` 768, `lg` 1024, `xl` 1280.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => subscribe(query, cb),
    snapshot(query),
    () => false
  );
}
