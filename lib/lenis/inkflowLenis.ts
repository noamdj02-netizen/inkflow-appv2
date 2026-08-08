import type Lenis from 'lenis';
import type { LenisOptions } from 'lenis';

/** Conteneurs scroll InkFlow (fixed + overflow-y — voir index.css). */
export const INKFLOW_LENIS_SCROLL_SELECTORS = [
  '.landing-scroll',
  '.public-page-scroll',
  '.founder-admin-scroll-root',
] as const;

/** Routes sans Lenis — scroll natif (dashboard, booking, auth, formulaires). */
const LENIS_DISABLED_PREFIXES = [
  '/dashboard',
  '/admin',
  '/book/',
  '/client/',
  '/login',
  '/signup',
  '/auth/',
  '/reset-password',
  '/discover/bienvenue',
  '/discover/login',
  '/dashboard-shadcn-preview',
];

/** Sélecteurs exclus du smooth scroll Lenis (scroll natif / nested). */
export const INKFLOW_LENIS_PREVENT_SELECTORS = [
  '[data-lenis-prevent]',
  '.dashboard-pro-shell',
  '.app-shell',
  '.app-shell-content',
  '.app-shell-sidebar',
  '[data-dashboard-scroll-root]',
  '.book-public-scroll',
] as const;

export function shouldEnableInkflowLenis(pathname: string): boolean {
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  if (LENIS_DISABLED_PREFIXES.some((p) => path === p || path.startsWith(p))) return false;
  return true;
}

export function findInkflowScrollContainer(): HTMLElement | null {
  for (const selector of INKFLOW_LENIS_SCROLL_SELECTORS) {
    const el = document.querySelector(selector);
    if (el instanceof HTMLElement) return el;
  }
  return null;
}

export function getInkflowLenisOptions(wrapper: HTMLElement): LenisOptions {
  const content =
    wrapper.firstElementChild instanceof HTMLElement ? wrapper.firstElementChild : wrapper;

  return {
    wrapper,
    content,
    eventsTarget: wrapper,
    autoRaf: false,
    lerp: 0.1,
    smoothWheel: true,
    respectReducedMotion: true,
    anchors: true,
    prevent: (node: Element) =>
      INKFLOW_LENIS_PREVENT_SELECTORS.some((selector) => node.closest(selector) != null),
  };
}

export function scrollInkflowContainerToTop(container?: HTMLElement | null): void {
  const el = container ?? findInkflowScrollContainer();
  if (el) el.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

export function scrollInkflowToHash(hash: string, lenis?: Lenis | null): void {
  const id = hash.replace(/^#/, '').trim();
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;

  if (lenis && !lenis.isStopped) {
    lenis.scrollTo(target, { offset: -72, lock: false });
    return;
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
