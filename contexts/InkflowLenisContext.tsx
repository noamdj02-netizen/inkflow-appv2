import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Lenis from 'lenis';
import { cancelFrame, frame, useReducedMotion } from 'framer-motion';
import {
  findInkflowScrollContainer,
  getInkflowLenisOptions,
  scrollInkflowContainerToTop,
  scrollInkflowToHash,
  shouldEnableInkflowLenis,
} from '@/lib/lenis/inkflowLenis';
import { InkflowGsapScrollEffects } from '@/components/motion/InkflowGsapScrollEffects';

interface InkflowLenisContextValue {
  lenis: Lenis | null;
  scrollContainer: HTMLElement | null;
  scrollToHash: (hash: string) => void;
  scrollToTop: () => void;
}

const InkflowLenisContext = createContext<InkflowLenisContextValue>({
  lenis: null,
  scrollContainer: null,
  scrollToHash: (hash) => scrollInkflowToHash(hash),
  scrollToTop: () => scrollInkflowContainerToTop(),
});

export function useInkflowLenis(): InkflowLenisContextValue {
  return useContext(InkflowLenisContext);
}

/** Scroll top du conteneur marketing (navbar glass, ancres). */
export function useLandingScrollTop(threshold = 12): boolean {
  const { scrollContainer, lenis } = useInkflowLenis();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const read = () => {
      const top = lenis?.scroll ?? scrollContainer?.scrollTop ?? window.scrollY;
      setScrolled(top > threshold);
    };
    read();

    if (lenis) {
      lenis.on('scroll', read);
      return () => lenis.off('scroll', read);
    }

    const el = scrollContainer;
    if (el) {
      el.addEventListener('scroll', read, { passive: true });
      return () => el.removeEventListener('scroll', read);
    }

    window.addEventListener('scroll', read, { passive: true });
    return () => window.removeEventListener('scroll', read);
  }, [lenis, scrollContainer, threshold]);

  return scrolled;
}

interface InkflowLenisProviderProps {
  routePath: string;
  children: React.ReactNode;
}

/**
 * Active Lenis uniquement sur routes marketing / vitrine / explorer
 * quand un `.landing-scroll` (ou équivalent) est monté.
 */
export function InkflowLenisProvider({ routePath, children }: InkflowLenisProviderProps) {
  const reduceMotion = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  const enabled = shouldEnableInkflowLenis(routePath) && !reduceMotion;

  useEffect(() => {
    if (!enabled) {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      setLenis(null);
      setScrollContainer(null);
      return;
    }

    let cancelled = false;
    let attachAttempts = 0;
    let rafCleanup: (() => void) | undefined;

    const attach = () => {
      if (cancelled) return;
      const wrapper = findInkflowScrollContainer();
      if (!wrapper) {
        attachAttempts += 1;
        if (attachAttempts < 24) {
          requestAnimationFrame(attach);
        }
        return;
      }

      lenisRef.current?.destroy();
      const instance = new Lenis(getInkflowLenisOptions(wrapper));
      lenisRef.current = instance;
      setLenis(instance);
      setScrollContainer(wrapper);

      const onFrame = (data: { timestamp: number }) => {
        instance.raf(data.timestamp);
      };
      frame.update(onFrame, true);
      rafCleanup = () => cancelFrame(onFrame);
    };

    attach();

    return () => {
      cancelled = true;
      rafCleanup?.();
      lenisRef.current?.destroy();
      lenisRef.current = null;
      setLenis(null);
      setScrollContainer(null);
    };
  }, [enabled, routePath]);

  const scrollToHash = useCallback((hash: string) => {
    scrollInkflowToHash(hash, lenisRef.current);
  }, []);

  const scrollToTop = useCallback(() => {
    const instance = lenisRef.current;
    if (instance) {
      instance.scrollTo(0, { immediate: false });
      return;
    }
    scrollInkflowContainerToTop(scrollContainer);
  }, [scrollContainer]);

  const value = useMemo(
    () => ({ lenis, scrollContainer, scrollToHash, scrollToTop }),
    [lenis, scrollContainer, scrollToHash, scrollToTop]
  );

  return (
    <InkflowLenisContext.Provider value={value}>
      {children}
      <InkflowGsapScrollEffects routeKey={routePath} />
    </InkflowLenisContext.Provider>
  );
}
