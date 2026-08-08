import { useEffect } from 'react';
import { useInkflowLenis } from '@/contexts/InkflowLenisContext';
import { scrollInkflowContainerToTop } from '@/lib/lenis/inkflowLenis';
import { getDashboardScrollRoot } from '@/hooks/useDashboardScroll';

interface InkflowRouterNavigationProps {
  onNavigate: (pathnameWithSearch: string) => void;
}

/**
 * Interception des liens internes + ancres — scroll Lenis ou fallback natif.
 */
export function InkflowRouterNavigation({ onNavigate }: InkflowRouterNavigationProps) {
  const { scrollToHash, scrollToTop } = useInkflowLenis();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      const rawHref = anchor?.getAttribute('href')?.trim() ?? '';
      if (
        rawHref.startsWith('mailto:') ||
        rawHref.startsWith('tel:') ||
        rawHref.startsWith('sms:')
      ) {
        return;
      }
      if (anchor && anchor.href.startsWith(window.location.origin) && !anchor.target) {
        e.preventDefault();
        const url = new URL(anchor.href);
        const fullUrl = url.pathname + url.search + (url.hash || '');
        window.history.pushState({}, '', fullUrl);
        onNavigate(url.pathname + url.search);

        if (url.hash) {
          const scrollToSection = () => scrollToHash(url.hash);
          if (url.pathname === window.location.pathname) {
            scrollToSection();
          } else {
            setTimeout(scrollToSection, 150);
          }
        } else {
          scrollToTop();
          scrollInkflowContainerToTop(document.querySelector('.book-public-scroll'));
          getDashboardScrollRoot()?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onNavigate, scrollToHash, scrollToTop]);

  return null;
}
