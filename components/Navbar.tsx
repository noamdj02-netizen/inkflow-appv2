import React, { useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';

interface NavbarProps {
  scrolled: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ scrolled }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out px-4 sm:px-6 lg:px-8 py-4 safe-top ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-neutral-200/80 shadow-sm shadow-neutral-900/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 group">
          <Logo />
          <span className="text-xl font-bold tracking-tight text-neutral-900 group-hover:opacity-80 transition-opacity">
            InkFlow
          </span>
        </a>

        <div className="hidden md:flex items-center gap-1">
          <a
            href="#features"
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-100/80 transition-all duration-200"
          >
            Fonctionnalités
          </a>
          <a
            href="#pricing"
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-100/80 transition-all duration-200"
          >
            Tarifs
          </a>
          <a
            href="#faq"
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-100/80 transition-all duration-200"
          >
            FAQ
          </a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="/login"
            className="px-4 py-2.5 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors rounded-xl"
          >
            Connexion Artiste
          </a>
          <a
            href="/signup"
            className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-neutral-900 text-white text-sm font-semibold transition-all duration-300 hover:bg-neutral-800 shadow-lg shadow-neutral-900/15 hover:shadow-xl hover:shadow-neutral-900/20 hover:-translate-y-0.5"
          >
            Accès Anticipé
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
          </a>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2.5 rounded-xl text-neutral-700 hover:bg-neutral-100 transition-colors"
          aria-label="Menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {isOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-neutral-900/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="md:hidden absolute top-full left-4 right-4 mt-2 bg-white rounded-2xl border border-neutral-200 shadow-xl p-4 flex flex-col gap-1 z-50">
            <a
              href="#features"
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 text-base font-medium text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors"
            >
              Fonctionnalités
            </a>
            <a
              href="#pricing"
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 text-base font-medium text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors"
            >
              Tarifs
            </a>
            <a
              href="#faq"
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 text-base font-medium text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors"
            >
              FAQ
            </a>
            <div className="border-t border-neutral-100 my-2" />
            <a
              href="/login"
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 text-base font-medium text-neutral-700 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors text-center"
            >
              Connexion Artiste
            </a>
            <a
              href="/signup"
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 text-base font-semibold text-white bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-colors text-center flex items-center justify-center gap-2"
            >
              Accès Anticipé
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </>
      )}
    </nav>
  );
};
