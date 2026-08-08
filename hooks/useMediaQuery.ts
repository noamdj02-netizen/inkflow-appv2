import { useEffect, useState } from 'react';

/** S'abonne aux changements `matchMedia` (resize, orientation) — évite l'état périmé sous iOS / split-view. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [query]);

  return matches;
}

/** Breakpoint Tailwind `md` (768px) — usages : layout dashboard, héros, listes tactiles. */
export function useBreakpointMd(): boolean {
  return useMediaQuery('(min-width: 768px)');
}
