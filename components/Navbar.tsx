import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';
import { LANDING_URL, LANDING_PRICING_URL } from '../lib/urls';

interface NavbarProps {
  scrolled?: boolean;
  variant?: 'default' | 'landing-dark';
}

const navLinks = [
  { href: '/dashboard-demo', label: 'Démo' },
  { href: `${LANDING_URL}/#features`, label: 'Fonctionnalités' },
  { href: LANDING_PRICING_URL, label: 'Tarifs' },
  { href: `${LANDING_URL}/#faq`, label: 'FAQ' },
];

export const Navbar: React.FC<NavbarProps> = ({ variant = 'default' }) => {
  const isLandingDark = variant === 'landing-dark';
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer au clavier Escape
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
      <nav
        className={`
          fixed z-50
          top-2 left-4 right-4 w-[calc(100%-2rem)] mx-auto
          md:top-6 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[90%] md:max-w-4xl
          rounded-2xl md:rounded-full
          px-4 py-2 md:px-6 md:py-3
          pt-[max(0.5rem,env(safe-area-inset-top))] md:pt-3
          animate-navbar-in
          ${isLandingDark
            ? 'bg-white/5 md:bg-white/5 backdrop-blur-xl border border-white/5 text-white'
            : 'bg-white md:bg-white/90 dark:bg-white md:dark:bg-black/60 md:backdrop-blur-xl border border-gray-200/80 md:border-gray-200/60 md:dark:border-white/10 shadow-lg shadow-black/5'
          }
        `}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Logo — gauche, contraint h-8, invert pour fond blanc / normal pour fond sombre */}
          <a href={LANDING_URL} className="flex items-center gap-2 min-w-0 shrink-0 active:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer">
            <Logo size="sm" className={isLandingDark ? 'invert' : 'invert dark:invert-0'} />
            <span className={`text-base font-bold tracking-tight truncate hidden sm:inline ${isLandingDark ? 'text-white' : 'text-neutral-900 dark:text-white'}`}>
              InkFlow
            </span>
          </a>

          {/* Liens — centre (desktop) */}
          <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-full hover:bg-white/10 transition-all duration-200 ${
                  isLandingDark ? 'text-zinc-400 hover:text-white' : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white dark:hover:bg-white/10'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA + Burger — droite */}
          <div className="flex items-center gap-1 shrink-0">
            <a
              href="/login"
              className={`hidden md:inline-flex px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 hover:scale-[1.02] ${
                isLandingDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/10'
              }`}
            >
              Connexion
            </a>
            <a
              href="/signup"
              className={`hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-[1.02] ${
                isLandingDark ? 'bg-white text-[#0a0a0f] hover:bg-zinc-100' : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 shadow-md hover:shadow-lg'
              }`}
            >
              Accès Anticipé
              <ArrowRight className="w-4 h-4" />
            </a>

            {/* Burger mobile — zone de touche 44px minimum */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`md:hidden p-3 -m-1 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation ${
                isLandingDark ? 'text-zinc-400 hover:bg-white/10 active:bg-white/15' : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 active:bg-neutral-200/80 dark:active:bg-white/15'
              }`}
              aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={isOpen}
              aria-controls="nav-menu-mobile"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Drawer mobile — fond 100% opaque, backdrop rgba(0,0,0,0.6) */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-[9999] flex flex-col"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: '100dvh',
            minHeight: '-webkit-fill-available',
            backgroundColor: 'rgba(0,0,0,0.6)'
          }}
          aria-hidden="false"
        >
          {/* Overlay cliquable — ferme au tap */}
          <div
            className="absolute inset-0"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer — fond 100% opaque (mobile: évite transparence WebKit/PWA) */}
          <div
            id="nav-menu-mobile"
            ref={menuRef}
            className="absolute inset-x-4 bottom-0 top-0 mx-auto w-full max-w-[400px] flex flex-col rounded-t-2xl rounded-b-2xl shadow-2xl animate-navbar-drawer overflow-hidden"
            style={{
              marginTop: 'max(0px, env(safe-area-inset-top))',
              marginBottom: 'max(0px, env(safe-area-inset-bottom))',
              maxHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
              backgroundColor: typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark' ? '#09090B' : '#ffffff'
            }}
            role="dialog"
            aria-label="Menu de navigation"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — fond opaque (mobile) */}
            <div
              className="flex items-center justify-between shrink-0 px-4 py-3 border-b border-gray-200/60 dark:border-zinc-700"
              style={{
                paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
                backgroundColor: typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark' ? '#09090B' : '#ffffff'
              }}
            >
              <span className="text-sm font-semibold text-neutral-500 dark:text-zinc-400">Menu</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-neutral-700 dark:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-zinc-800 active:bg-neutral-200 dark:active:bg-zinc-700 transition-colors touch-manipulation -mr-1"
                aria-label="Fermer le menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {/* Contenu — fond opaque (mobile) */}
            <div
              className="flex flex-col gap-0.5 py-4 px-4 overflow-y-auto flex-1 min-h-0"
              style={{
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                backgroundColor: typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark' ? '#09090B' : '#ffffff'
              }}
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3.5 text-base font-medium text-neutral-700 dark:text-zinc-300 rounded-xl hover:bg-neutral-100 dark:hover:bg-zinc-800 active:bg-neutral-200 dark:active:bg-zinc-700 transition-colors touch-manipulation"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t border-gray-200/60 dark:border-zinc-700 my-2" />
              <a
                href="/login"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3.5 text-base font-medium text-neutral-700 dark:text-zinc-300 rounded-xl hover:bg-neutral-100 dark:hover:bg-zinc-800 active:bg-neutral-200 dark:active:bg-zinc-700 transition-colors text-center touch-manipulation"
              >
                Connexion
              </a>
              <a
                href="/signup"
                onClick={() => setIsOpen(false)}
                className="mx-4 mt-2 mb-2 py-3.5 text-base font-semibold text-white bg-neutral-900 rounded-xl hover:bg-neutral-800 active:scale-[0.98] transition-all text-center flex items-center justify-center gap-2 touch-manipulation"
              >
                Accès Anticipé
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
