import React, { useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';

interface NavbarProps {
  scrolled: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ scrolled }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-4 sm:px-6 lg:px-8 py-4 ${
        scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-neutral-200' : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-black text-xl tracking-tighter shadow-lg shadow-black/20">
            IF.
          </div>
          <span className="text-xl font-bold tracking-tight text-neutral-900">Inkflow</span>
        </a>

        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-sm font-medium text-neutral-600 hover:text-black transition-colors">Fonctionnalités</a>
          <a href="#pricing" className="text-sm font-medium text-neutral-600 hover:text-black transition-colors">Tarifs</a>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <a href="/login" className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors">Connexion Artiste</a>
          <a
            href="/signup"
            className="group px-6 py-2.5 rounded-xl bg-black text-white text-sm font-semibold transition-all hover:bg-neutral-800 hover:scale-105 shadow-xl shadow-black/10 flex items-center"
          >
            Accès Anticipé
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-neutral-900 p-2">
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-4 shadow-lg flex flex-col space-y-4">
          <a href="#features" className="text-base font-medium text-neutral-600 px-4 py-2 hover:bg-neutral-50 rounded-lg">Fonctionnalités</a>
          <a href="#pricing" className="text-base font-medium text-neutral-600 px-4 py-2 hover:bg-neutral-50 rounded-lg">Tarifs</a>
          <hr className="border-gray-100" />
          <div className="flex flex-col space-y-2 p-2">
            <a href="/login" className="w-full py-3 rounded-xl bg-neutral-100 text-neutral-900 font-medium text-center">Connexion Artiste</a>
            <a href="/signup" className="w-full py-3 rounded-xl bg-black text-white font-medium text-center shadow-lg">Accès Anticipé</a>
          </div>
        </div>
      )}
    </nav>
  );
};
