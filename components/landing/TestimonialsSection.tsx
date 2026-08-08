/**
 * Section témoignages — carrousel FR (i18n) ou embed Testimonial.to (espace inkflow).
 */
import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { LANDING_TESTIMONIAL_TO_EMBED_ENABLED } from '../../lib/landingFlags';
import {
  TESTIMONIAL_TO_EMBED_SRC,
  TESTIMONIAL_TO_IFRAME_ID,
  TESTIMONIAL_TO_RESIZER_SCRIPT,
  TESTIMONIAL_TO_WALL_URL,
  TESTIMONIAL_TO_SPACE_URL,
} from '../../lib/landingTestimonials';
import { LandingMotionItem, LandingMotionReveal } from './landingMotion';

const CARD_WIDTH = 360;
const GAP = 24;
const AUTO_SCROLL_INTERVAL = 6000;

const testimonialKeys = [
  { quoteKey: 'testimonials.quote1', nameKey: 'testimonials.name1', roleKey: 'testimonials.role1' },
  { quoteKey: 'testimonials.quote2', nameKey: 'testimonials.name2', roleKey: 'testimonials.role2' },
  { quoteKey: 'testimonials.quote3', nameKey: 'testimonials.name3', roleKey: 'testimonials.role3' },
  { quoteKey: 'testimonials.quote4', nameKey: 'testimonials.name4', roleKey: 'testimonials.role4' },
  { quoteKey: 'testimonials.quote5', nameKey: 'testimonials.name5', roleKey: 'testimonials.role5' },
  { quoteKey: 'testimonials.quote6', nameKey: 'testimonials.name6', roleKey: 'testimonials.role6' },
] as const;

declare global {
  interface Window {
    iFrameResize?: (options: { log?: boolean; checkOrigin?: boolean }, selector: string) => void;
  }
}

function loadIframeResizer(onLoad: () => void): () => void {
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${TESTIMONIAL_TO_RESIZER_SCRIPT}"]`
  );
  if (existing) {
    if (existing.dataset.loaded === 'true') {
      onLoad();
    } else {
      existing.addEventListener('load', onLoad, { once: true });
    }
    return () => existing.removeEventListener('load', onLoad);
  }

  const script = document.createElement('script');
  script.src = TESTIMONIAL_TO_RESIZER_SCRIPT;
  script.async = true;
  script.onload = () => {
    script.dataset.loaded = 'true';
    onLoad();
  };
  document.body.appendChild(script);
  return () => script.removeEventListener('load', onLoad);
}

function TestimonialToEmbed() {
  useEffect(() => {
    const selector = `#${TESTIMONIAL_TO_IFRAME_ID}`;
    const initResize = () => {
      window.iFrameResize?.({ log: false, checkOrigin: false }, selector);
    };
    return loadIframeResizer(initResize);
  }, []);

  return (
    <iframe
      id={TESTIMONIAL_TO_IFRAME_ID}
      src={TESTIMONIAL_TO_EMBED_SRC}
      title="Avis clients InkFlow"
      className="w-full border-0"
      scrolling="no"
    />
  );
}

function TestimonialCarousel() {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const testimonials = testimonialKeys.map((item) => ({
    id: item.quoteKey,
    quote: t(item.quoteKey),
    name: t(item.nameKey),
    role: t(item.roleKey),
  }));

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    updateScrollState();
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const el = scrollRef.current;
    if (!el) return;
    const step = CARD_WIDTH + GAP;
    const id = setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      const next = el.scrollLeft + step;
      if (next >= maxScroll) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
      setTimeout(updateScrollState, 350);
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(id);
  }, [isPaused]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const step = (CARD_WIDTH + GAP) * (direction === 'left' ? -1 : 1);
    el.scrollBy({ left: step, behavior: 'smooth' });
    setTimeout(updateScrollState, 350);
  };

  return (
    <div className="relative md:px-12">
      <div className="absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 md:flex">
        <button
          type="button"
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-lg transition-all hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          aria-label={t('testimonials.prev')}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>
      <div className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 md:flex">
        <button
          type="button"
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-lg transition-all hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          aria-label={t('testimonials.next')}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="testimonials-carousel -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto overflow-y-visible scroll-smooth px-4 pb-2 sm:mx-0 sm:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        <style>{`.testimonials-carousel::-webkit-scrollbar { display: none; }`}</style>
        {testimonials.map((item, idx) => (
          <LandingMotionItem
            key={item.id}
            as="article"
            index={idx}
            standalone
            className="w-[min(100%,340px)] flex-shrink-0 snap-center snap-always sm:w-[320px] md:w-[360px]"
          >
            <div className="relative flex h-full min-h-[240px] flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow duration-300 [@media(hover:hover)]:hover:border-zinc-300 [@media(hover:hover)]:hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:[@media(hover:hover)]:hover:border-zinc-700 sm:p-8">
              <div
                className="pointer-events-none absolute right-5 top-5 select-none font-serif text-5xl leading-none text-zinc-100 dark:text-zinc-500/20 sm:right-6 sm:top-6 sm:text-6xl"
                aria-hidden
              >
                &ldquo;
              </div>
              <p className="relative mb-6 flex-1 pr-2 text-[15px] italic leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-base">
                {item.quote}
              </p>
              <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.name}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{item.role}</p>
              </div>
            </div>
          </LandingMotionItem>
        ))}
      </div>
    </div>
  );
}

export const TestimonialsSection: React.FC = () => {
  const { t } = useLanguage();
  const useEmbed = LANDING_TESTIMONIAL_TO_EMBED_ENABLED;

  return (
    <section
      id="avis"
      className="overflow-hidden bg-zinc-50 px-4 py-16 dark:bg-zinc-950 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <LandingMotionReveal as="header" className="mb-10 text-center sm:mb-14">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            {t('testimonials.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-zinc-600 dark:text-zinc-400 sm:text-lg">
            {t('testimonials.subtitle')}
          </p>
        </LandingMotionReveal>

        {useEmbed ? <TestimonialToEmbed /> : <TestimonialCarousel />}

        <p className="mt-10 flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-6">
          <a
            href={TESTIMONIAL_TO_WALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            {t('testimonials.viewWall')}
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          </a>
          <a
            href={TESTIMONIAL_TO_SPACE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            {t('testimonials.leaveReview')}
            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </a>
        </p>
      </div>
    </section>
  );
};
