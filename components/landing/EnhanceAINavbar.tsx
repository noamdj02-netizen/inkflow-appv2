import React, { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { Logo } from '../Logo';
import { useLanguage } from '../../contexts/LanguageContext';

const navLinksConfig = [
  { href: '/vue-ensemble', key: 'nav.overview' },
  { href: '/demandes', key: 'nav.requests' },
  { href: '/rendez-vous', key: 'nav.appointments' },
  { href: '/galerie-flash', key: 'nav.flash' },
  { href: '/clients', key: 'nav.clients' },
  { href: '/messagerie', key: 'nav.messaging' },
  { href: '/portfolio', key: 'nav.portfolio' },
  { href: '/finance', key: 'nav.finance' },
  { href: '/parametres', key: 'nav.settings' },
];

export const EnhanceAINavbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);

  const navLinks = navLinksConfig.map((l) => ({ ...l, label: t(l.key) }));

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
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/60 shadow-sm"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2 shrink-0">
              <Logo size="sm" className="invert-0" />
              <span className="text-lg font-bold text-neutral-900 tracking-tight">Inkflow</span>
            </a>

            <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center overflow-x-auto scrollbar-hide">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-2.5 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100/80 transition-colors whitespace-nowrap flex-shrink-0"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-neutral-100/80">
                <button
                  onClick={() => setLang('fr')}
                  className={`text-xs font-medium px-2 py-1 rounded transition-colors ${lang === 'fr' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  Fr
                </button>
                <button
                  onClick={() => setLang('en')}
                  className={`text-xs font-medium px-2 py-1 rounded transition-colors ${lang === 'en' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  En
                </button>
              </div>
              <a
                href="/login"
                className="hidden sm:inline-flex px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/25"
              >
                {t('nav.login')}
              </a>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
                aria-label={isOpen ? 'Fermer' : 'Menu'}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-[9998] bg-black/40" onClick={() => setIsOpen(false)}>
          <div
            ref={menuRef}
            className="absolute top-16 left-4 right-4 bg-white rounded-2xl shadow-2xl border border-neutral-200/80 py-4 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setIsOpen(false)} className="block px-5 py-3 text-neutral-700 hover:bg-neutral-50 font-medium">
                {link.label}
              </a>
            ))}
            <a href="/login" onClick={() => setIsOpen(false)} className="mx-4 mt-4 block text-center py-3 rounded-xl bg-blue-600 text-white font-semibold">
              {t('nav.login')}
            </a>
          </div>
        </div>
      )}
    </>
  );
};
