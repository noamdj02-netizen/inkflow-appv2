import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from 'framer-motion';
import { useInkflowLenis } from '@/contexts/InkflowLenisContext';
import {
  bindLenisScrollTrigger,
  clearInkflowScrollInitFlags,
  hasInkflowScrollAnimationTargets,
  mountInkflowScrollAnimations,
} from '@/lib/gsap/syncLenisScrollTrigger';

interface InkflowGsapScrollEffectsProps {
  routeKey: string;
}

/**
 * ScrollTrigger marketing — reveals, stagger, hero scrub, parallax démo.
 * Init incrémentale + MutationObserver pour sections lazy (Suspense).
 */
export function InkflowGsapScrollEffects({ routeKey }: InkflowGsapScrollEffectsProps) {
  const reduceMotion = useReducedMotion();
  const { lenis, scrollContainer } = useInkflowLenis();
  const gsapCtxRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    if (reduceMotion || !lenis || !scrollContainer) return;

    let cancelled = false;
    let unbindLenis: (() => void) | undefined;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    const teardown = () => {
      gsapCtxRef.current?.revert();
      gsapCtxRef.current = null;
      clearInkflowScrollInitFlags(scrollContainer);
      unbindLenis?.();
      unbindLenis = undefined;
    };

    const ensureContext = () => {
      if (!gsapCtxRef.current) {
        gsapCtxRef.current = gsap.context(() => {}, scrollContainer);
      }
      return gsapCtxRef.current;
    };

    const setup = () => {
      if (cancelled || !scrollContainer) return;
      if (!hasInkflowScrollAnimationTargets(scrollContainer)) return;

      if (!unbindLenis) {
        unbindLenis = bindLenisScrollTrigger(lenis, scrollContainer);
      }

      const ctx = ensureContext();
      mountInkflowScrollAnimations(scrollContainer, ctx);
    };

    const scheduleSetup = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshTimer = undefined;
        setup();
      }, 80);
    };

    scheduleSetup();

    const observer = new MutationObserver((mutations) => {
      const addedTargets = mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some((node) => {
          if (!(node instanceof Element)) return false;
          return (
            node.matches(
              '[data-gsap-reveal], [data-gsap-reveal-group], [data-gsap-scrub], [data-gsap-hero]'
            ) ||
            Boolean(
              node.querySelector(
                '[data-gsap-reveal], [data-gsap-reveal-group], [data-gsap-scrub], [data-gsap-hero]'
              )
            )
          );
        })
      );
      if (addedTargets) scheduleSetup();
    });
    observer.observe(scrollContainer, { childList: true, subtree: true });

    return () => {
      cancelled = true;
      observer.disconnect();
      if (refreshTimer) clearTimeout(refreshTimer);
      teardown();
    };
  }, [lenis, scrollContainer, reduceMotion, routeKey]);

  return null;
}
