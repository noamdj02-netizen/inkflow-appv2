import { useEffect, useState } from 'react';

/** Chemin courant (SPA custom router — pas de react-router). */
export function useInkflowPathname(): string {
  const [pathname, setPathname] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', sync);
    window.addEventListener('inkflow-navigate', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('inkflow-navigate', sync);
    };
  }, []);
  return pathname;
}
