import * as React from 'react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANDING_URL } from '@/lib/urls';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/#demo', key: 'nav.demo' },
  { href: '/#fonctionnalites', key: 'nav.features' },
  { href: '/#pricing', key: 'nav.pricing' },
  { href: '/#avis', key: 'nav.reviews' },
] as const;

export function Navbar1() {
  const [isOpen, setIsOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const toggleMenu = () => setIsOpen((open) => !open);
  const closeMenu = () => setIsOpen(false);

  const navLinks = NAV_LINKS.map((link) => ({ ...link, label: t(link.key) }));

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
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
        className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6"
        aria-label="Navigation principale"
      >
        <div className="pointer-events-auto relative z-10 flex w-full max-w-3xl items-center justify-between rounded-full border border-zinc-200/80 bg-white/95 px-4 py-2.5 shadow-lg shadow-zinc-900/5 backdrop-blur-md sm:px-6 sm:py-3">
          <a
            href={LANDING_URL}
            className="flex shrink-0 items-center gap-2.5"
            target="_blank"
            rel="noopener noreferrer"
          >
            <motion.div
              className="flex items-center"
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              whileHover={{ rotate: 4 }}
              transition={{ duration: 0.25 }}
            >
              <Logo size="sm" />
            </motion.div>
            <span className="font-hero-title text-sm font-bold tracking-tight text-zinc-900 sm:text-base">
              Inkflow
            </span>
          </a>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
            {navLinks.map((item) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                whileHover={{ scale: 1.03 }}
              >
                <a
                  href={item.href}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                >
                  {item.label}
                </a>
              </motion.div>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <div className="flex items-center rounded-full border border-zinc-200 bg-zinc-50 p-0.5">
              <button
                type="button"
                onClick={() => setLang('fr')}
                className={cn(
                  'rounded-full px-2 py-1 text-xs font-semibold transition-colors',
                  lang === 'fr' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-800'
                )}
              >
                Fr
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={cn(
                  'rounded-full px-2 py-1 text-xs font-semibold transition-colors',
                  lang === 'en' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-800'
                )}
              >
                En
              </button>
            </div>
            <a
              href="/login"
              className="text-sm font-semibold text-zinc-600 transition-colors hover:text-zinc-900"
            >
              {t('nav.login')}
            </a>
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: 0.1 }}
              whileHover={{ scale: 1.03 }}
            >
              <a
                href="/signup"
                className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 active:scale-[0.98]"
              >
                {t('nav.trial')}
              </a>
            </motion.div>
          </div>

          <motion.button
            type="button"
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 md:hidden"
            onClick={toggleMenu}
            whileTap={{ scale: 0.92 }}
            aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isOpen}
          >
            <Menu className="h-5 w-5 text-zinc-900" strokeWidth={2} />
          </motion.button>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[9999] bg-white pt-24 px-6 md:hidden"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <motion.button
              type="button"
              className="absolute right-4 top-[max(1.25rem,env(safe-area-inset-top))] inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-zinc-200"
              onClick={closeMenu}
              whileTap={{ scale: 0.92 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5 text-zinc-900" strokeWidth={2} />
            </motion.button>

            <div className="flex flex-col space-y-2">
              {navLinks.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 + 0.08 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <a
                    href={item.href}
                    className="block rounded-xl px-2 py-3.5 text-base font-medium text-zinc-900"
                    onClick={closeMenu}
                  >
                    {item.label}
                  </a>
                </motion.div>
              ))}

              <div className="flex items-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setLang('fr')}
                  className={cn(
                    'flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors',
                    lang === 'fr'
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 text-zinc-700'
                  )}
                >
                  Français
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={cn(
                    'flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors',
                    lang === 'en'
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 text-zinc-700'
                  )}
                >
                  English
                </button>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                exit={{ opacity: 0, y: 16 }}
                className="flex flex-col gap-2 pt-4"
              >
                <a
                  href="/login"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-zinc-200 text-base font-semibold text-zinc-900"
                  onClick={closeMenu}
                >
                  {t('nav.login')}
                </a>
                <a
                  href="/signup"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-zinc-900 text-base font-semibold text-white active:scale-[0.98]"
                  onClick={closeMenu}
                >
                  {t('nav.trial')}
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
