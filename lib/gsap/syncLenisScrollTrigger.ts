import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const REVEAL_EASE = 'power3.out';
const INIT_FLAG = 'data-gsap-init';

function parseScrubValue(el: HTMLElement, attr: string, fallback: number): number {
  const raw = el.getAttribute(attr);
  if (raw == null || raw === '') return fallback;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

function markInitialized(el: Element): boolean {
  if (el.hasAttribute(INIT_FLAG)) return false;
  el.setAttribute(INIT_FLAG, '1');
  return true;
}

/**
 * Sync ScrollTrigger avec Lenis sur un conteneur `.landing-scroll` (pas window).
 */
export function bindLenisScrollTrigger(lenis: Lenis, scroller: HTMLElement): () => void {
  ScrollTrigger.scrollerProxy(scroller, {
    scrollTop(value) {
      if (arguments.length) {
        lenis.scrollTo(value, { immediate: true });
      }
      return lenis.scroll;
    },
    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: scroller.clientWidth,
        height: scroller.clientHeight,
      };
    },
    pinType: scroller.style.transform ? 'transform' : 'fixed',
  });

  ScrollTrigger.defaults({ scroller });

  const onScroll = () => ScrollTrigger.update();
  lenis.on('scroll', onScroll);

  const onRefresh = () => {
    lenis.resize();
  };
  ScrollTrigger.addEventListener('refresh', onRefresh);

  ScrollTrigger.refresh();

  return () => {
    lenis.off('scroll', onScroll);
    ScrollTrigger.removeEventListener('refresh', onRefresh);
    ScrollTrigger.scrollerProxy(scroller, {});
    ScrollTrigger.clearScrollMemory();
  };
}

/** Ajoute uniquement les animations pas encore initialisées (safe avec lazy Suspense). */
export function mountInkflowScrollAnimations(scroller: HTMLElement, ctx: gsap.Context): number {
  let mounted = 0;

  ctx.add(() => {
    scroller.querySelectorAll<HTMLElement>('[data-gsap-hero]').forEach((hero) => {
      if (!markInitialized(hero)) return;
      mounted += 1;

      const scrubTarget = hero.querySelector<HTMLElement>('[data-gsap-hero-scrub]');
      const contentTarget = hero.querySelector<HTMLElement>('[data-gsap-hero-content]');

      if (scrubTarget) {
        gsap.fromTo(
          scrubTarget,
          { y: 0, scale: 1 },
          {
            y: parseScrubValue(scrubTarget, 'data-gsap-scrub-y', 72),
            scale: 1 - parseScrubValue(scrubTarget, 'data-gsap-scrub-scale', 0.05),
            ease: 'none',
            scrollTrigger: {
              trigger: hero,
              scroller,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.55,
            },
          }
        );
      }

      if (contentTarget) {
        gsap.fromTo(
          contentTarget,
          { y: 0, opacity: 1 },
          {
            y: parseScrubValue(contentTarget, 'data-gsap-scrub-y', 36),
            opacity: 0.55,
            ease: 'none',
            scrollTrigger: {
              trigger: hero,
              scroller,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.45,
            },
          }
        );
      }
    });

    scroller.querySelectorAll<HTMLElement>('[data-gsap-scrub]').forEach((el) => {
      if (el.closest('[data-gsap-hero]')) return;
      if (!markInitialized(el)) return;
      mounted += 1;

      const trigger =
        (el.closest('[data-gsap-section]') as HTMLElement | null) ??
        (el.parentElement as HTMLElement);

      gsap.fromTo(
        el,
        { y: 0, scale: 1 },
        {
          y: -parseScrubValue(el, 'data-gsap-scrub-y', 40),
          scale: 1 + parseScrubValue(el, 'data-gsap-scrub-scale', 0.03),
          ease: 'none',
          scrollTrigger: {
            trigger,
            scroller,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.65,
          },
        }
      );
    });

    gsap.utils.toArray<HTMLElement>('[data-gsap-reveal]').forEach((el) => {
      if (el.querySelector('[data-gsap-reveal-group]')) return;
      if (!markInitialized(el)) return;
      mounted += 1;

      gsap.from(el, {
        y: 32,
        opacity: 0,
        duration: 0.9,
        ease: REVEAL_EASE,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: 'top 86%',
          toggleActions: 'play none none none',
          once: true,
        },
      });
    });

    gsap.utils.toArray<HTMLElement>('[data-gsap-reveal-group]').forEach((group) => {
      if (!markInitialized(group)) return;
      const items = group.querySelectorAll('[data-gsap-reveal-item]');
      if (!items.length) return;
      mounted += 1;

      gsap.from(items, {
        y: 28,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: REVEAL_EASE,
        scrollTrigger: {
          trigger: group,
          scroller,
          start: 'top 82%',
          toggleActions: 'play none none none',
          once: true,
        },
      });
    });
  });

  if (mounted > 0) {
    ScrollTrigger.refresh();
  }

  return mounted;
}

export function createInkflowScrollAnimations(scroller: HTMLElement): gsap.Context {
  const ctx = gsap.context(() => {}, scroller);
  mountInkflowScrollAnimations(scroller, ctx);
  return ctx;
}

/** @deprecated alias */
export const createInkflowScrollReveals = createInkflowScrollAnimations;

export function hasInkflowScrollAnimationTargets(root: ParentNode): boolean {
  return Boolean(
    root.querySelector('[data-gsap-reveal]:not([data-gsap-init])') ||
    root.querySelector('[data-gsap-reveal-group]:not([data-gsap-init])') ||
    root.querySelector('[data-gsap-scrub]:not([data-gsap-init])') ||
    root.querySelector('[data-gsap-hero]:not([data-gsap-init])')
  );
}

export function clearInkflowScrollInitFlags(root: ParentNode): void {
  root.querySelectorAll(`[${INIT_FLAG}]`).forEach((el) => el.removeAttribute(INIT_FLAG));
}
