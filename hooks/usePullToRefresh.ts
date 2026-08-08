import { useCallback, useEffect, useRef, useState } from 'react';

type RefreshFn = () => void | Promise<void>;

/**
 * Pull-to-refresh sur une zone interne à un conteneur scroll (ex. `.app-shell-content`).
 * Attacher `containerRef` au bloc racine de la vue (section ou div) : le hook remonte le scroll parent via `getScrollParent`.
 */
export function usePullToRefresh(
  onRefresh: RefreshFn | undefined,
  options: {
    getScrollParent: () => HTMLElement | null;
    disabled?: boolean;
    /** Pixels de tirage avant déclenchement (défaut 64) */
    threshold?: number;
  }
) {
  const { getScrollParent, disabled, threshold = 64 } = options;
  const containerRef = useRef<HTMLElement | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const startY = useRef(0);
  const active = useRef(false);
  const armed = useRef(false);
  const pullDistanceRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  refreshingRef.current = refreshing;

  const runRefresh = useCallback(async () => {
    const fn = onRefreshRef.current;
    if (!fn) return;
    if (refreshingRef.current) return;
    setRefreshing(true);
    refreshingRef.current = true;
    setPullDistance(0);
    pullDistanceRef.current = 0;
    try {
      await fn();
    } finally {
      setRefreshing(false);
      refreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || disabled) return;
    if (!onRefresh) return;

    const onStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      const sp = getScrollParent();
      if (!sp) return;
      if (sp.scrollTop > 2) return;
      startY.current = e.touches[0].clientY;
      active.current = true;
      armed.current = false;
    };

    const onMove = (e: TouchEvent) => {
      if (!active.current || refreshingRef.current) return;
      const sp = getScrollParent();
      if (!sp || sp.scrollTop > 2) {
        active.current = false;
        setPullDistance(0);
        pullDistanceRef.current = 0;
        return;
      }
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPullDistance(0);
        pullDistanceRef.current = 0;
        return;
      }
      if (!armed.current && dy > 8) {
        armed.current = true;
      }
      if (armed.current) {
        e.preventDefault();
        const damped = Math.min(dy * 0.45, 96);
        pullDistanceRef.current = damped;
        setPullDistance(damped);
      }
    };

    const onEnd = () => {
      if (!active.current) return;
      active.current = false;
      const d = pullDistanceRef.current;
      if (d >= threshold && !refreshingRef.current && onRefreshRef.current) {
        void runRefresh();
      } else {
        setPullDistance(0);
        pullDistanceRef.current = 0;
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [getScrollParent, disabled, onRefresh, threshold, runRefresh]);

  return {
    containerRef,
    pullDistance,
    refreshing,
  };
}
