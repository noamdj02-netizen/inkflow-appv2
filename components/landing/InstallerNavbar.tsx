/**
 * Navbar dédiée à la page /installer — liens in-app (app.ink-flow.me)
 * Évite de rediriger vers la landing Framer (ink-flow.me)
 */
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Logo } from '../Logo';
export const InstallerNavbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200/60 shadow-sm"
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <Logo size="sm" className="invert-0" />
            <span className="text-lg font-bold text-neutral-900 tracking-tight">InkFlow</span>
          </a>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden sm:inline-flex px-4 py-2.5 rounded-xl border-2 border-neutral-300 text-neutral-700 font-semibold text-sm hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
            >
              Connexion
            </a>
            <a
              href="/signup"
              className="hidden sm:inline-flex px-5 py-2.5 rounded-xl bg-neutral-900 text-white font-semibold text-sm hover:bg-neutral-800 transition-colors shadow-md"
            >
              Essai gratuit
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

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-[9998] bg-black/40" onClick={() => setIsOpen(false)}>
          <div
            className="absolute top-16 left-4 right-4 bg-white rounded-2xl shadow-2xl border border-neutral-200/80 py-4"
            onClick={(e) => e.stopPropagation()}
          >
            <a href="/login" onClick={() => setIsOpen(false)} className="block px-5 py-3 text-neutral-700 hover:bg-neutral-50 font-medium">
              Connexion
            </a>
            <a href="/signup" onClick={() => setIsOpen(false)} className="block px-5 py-3 text-neutral-700 hover:bg-neutral-50 font-medium">
              Essai gratuit
            </a>
            <a href="/" onClick={() => setIsOpen(false)} className="block px-5 py-3 text-neutral-700 hover:bg-neutral-50 font-medium">
              Accueil
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};
