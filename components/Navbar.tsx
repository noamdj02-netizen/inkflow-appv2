import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';

interface NavbarProps {
  scrolled?: boolean;
}

const navLinks = [
  { href: '#features', label: 'Fonctionnalités' },
  { href: '#pricing', label: 'Tarifs' },
  { href: '#faq', label: 'FAQ' },
];

export const Navbar: React.FC<NavbarProps> = () => {
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
          top-4 left-4 right-4 w-[calc(100%-2rem)] mx-auto
          md:top-6 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[90%] md:max-w-4xl
          rounded-2xl md:rounded-full
          bg-white md:bg-white/90
          dark:bg-white md:dark:bg-black/60
          md:backdrop-blur-xl
          border border-gray-200/80 md:border-gray-200/60 md:dark:border-white/10
          shadow-lg shadow-black/5
          px-4 py-3 md:px-6 md:py-3
          pt-[max(0.75rem,env(safe-area-inset-top))] md:pt-3
          animate-navbar-in
        `}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Logo — gauche (nom visible sur mobile pour clarté) */}
          <a href="/" className="flex items-center gap-2 min-w-0 shrink-0 active:opacity-80 transition-opacity">
            <Logo size="sm" />
            <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-white truncate hidden sm:inline">
              InkFlow
            </span>
          </a>

          {/* Liens — centre (desktop) */}
          <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-white/10 dark:hover:bg-white/10 transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA + Burger — droite */}
          <div className="flex items-center gap-1 shrink-0">
            <a
              href="/login"
              className="hidden md:inline-flex px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              Connexion
            </a>
            <a
              href="/signup"
              className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-semibold transition-all duration-200 hover:bg-neutral-800 dark:hover:bg-neutral-100 shadow-md hover:shadow-lg"
            >
              Accès Anticipé
              <ArrowRight className="w-4 h-4" />
            </a>

            {/* Burger mobile — zone de touche 44px minimum */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-3 -m-1 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 active:bg-neutral-200/80 dark:active:bg-white/15 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={isOpen}
              aria-controls="nav-menu-mobile"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay + menu mobile (drawer sous la navbar, safe area) */}
      {isOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            id="nav-menu-mobile"
            ref={menuRef}
            className="md:hidden fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[400px] max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200/80 py-4 px-4 box-border animate-navbar-dropdown"
            role="dialog"
            aria-label="Menu de navigation"
          >
            <div className="flex flex-col gap-0.5">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3.5 text-base font-medium text-neutral-700 rounded-xl hover:bg-neutral-100 active:bg-neutral-200/80 transition-colors touch-manipulation"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t border-gray-200/60 my-2" />
              <a
                href="/login"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3.5 text-base font-medium text-neutral-700 dark:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/10 active:bg-neutral-200/80 transition-colors text-center touch-manipulation"
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
        </>
      )}
    </>
  );
};
