import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Logo } from '../Logo';
import { useLanguage } from '../../contexts/LanguageContext';
import { LANDING_URL, LANDING_PRICING_URL } from '../../lib/urls';

const navLinksConfig = [
  { href: `${LANDING_URL}/#demo`, key: 'nav.demo' },
  { href: `${LANDING_URL}/#fonctionnalites`, key: 'nav.features' },
  { href: LANDING_PRICING_URL, key: 'nav.pricing' },
  { href: `${LANDING_URL}/#avis`, key: 'nav.reviews' },
];

export const EnhanceAINavbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);

  const navLinks = navLinksConfig.map((l) => ({ ...l, label: t(l.key) }));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-zinc-200/70 bg-white/75 shadow-[0_8px_30px_-20px_rgba(9,9,11,0.12)] backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        }`}
        style={{ paddingTop: 'max(0.35rem, env(safe-area-inset-top))' }}
      >
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <a
            href={LANDING_URL}
            className="flex shrink-0 items-center gap-2.5"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Logo size="sm" className="invert-0" />
            <span className="font-hero-title text-base font-bold tracking-tight text-zinc-950">
              Inkflow
            </span>
          </a>

          <nav
            className="hidden flex-1 items-center justify-center gap-1 lg:flex"
            aria-label="Principal"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100/80 hover:text-zinc-950"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center rounded-lg border border-zinc-200/80 bg-white/60 p-0.5 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setLang('fr')}
                className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                  lang === 'fr' ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Fr
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                  lang === 'en' ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                En
              </button>
            </div>
            <a
              href="/login"
              className="hidden text-sm font-semibold text-zinc-600 transition-colors hover:text-zinc-950 sm:inline-flex"
            >
              {t('nav.login')}
            </a>
            <a
              href="/signup"
              className="hidden min-h-[40px] items-center rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 sm:inline-flex active:scale-[0.98]"
            >
              {t('nav.trial')}
            </a>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-zinc-200/80 bg-white/70 text-zinc-700 backdrop-blur-sm lg:hidden"
              aria-label={isOpen ? 'Fermer' : 'Menu'}
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <X className="h-5 w-5" strokeWidth={2} />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[9998] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]" />
            <motion.div
              ref={menuRef}
              className="absolute left-4 right-4 top-[calc(3.75rem+env(safe-area-inset-top))] overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_24px_48px_-12px_rgba(9,9,11,0.18)]"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-h-[min(70dvh,520px)] overflow-y-auto py-2">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-5 py-3.5 text-[15px] font-medium text-zinc-800 hover:bg-zinc-50"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <div className="border-t border-zinc-100 p-4 flex flex-col gap-2">
                <a
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-800"
                >
                  {t('nav.login')}
                </a>
                <a
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  className="flex min-h-[44px] items-center justify-center rounded-xl bg-zinc-950 text-sm font-semibold text-white active:scale-[0.98]"
                >
                  {t('nav.trial')}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
