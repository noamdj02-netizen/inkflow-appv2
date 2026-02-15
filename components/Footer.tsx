import React from 'react';
import { Twitter, Instagram, Linkedin, Github } from 'lucide-react';
import { Logo } from './Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 safe-bottom">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-lg font-bold text-neutral-900 tracking-tight">InkFlow</span>
          </div>

          <div className="flex gap-8 text-neutral-400">
            <a href="#" className="hover:text-neutral-900 transition-colors duration-200 p-2 rounded-lg hover:bg-neutral-100"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="hover:text-neutral-900 transition-colors duration-200 p-2 rounded-lg hover:bg-neutral-100"><Instagram className="w-5 h-5" /></a>
            <a href="#" className="hover:text-neutral-900 transition-colors duration-200 p-2 rounded-lg hover:bg-neutral-100"><Linkedin className="w-5 h-5" /></a>
            <a href="#" className="hover:text-neutral-900 transition-colors duration-200 p-2 rounded-lg hover:bg-neutral-100"><Github className="w-5 h-5" /></a>
          </div>
        </div>

        <div className="mt-10 sm:mt-14 flex flex-col md:flex-row justify-between items-center text-sm text-neutral-500 border-t border-neutral-200/80 pt-8 sm:pt-10 gap-6">
          <p className="text-center md:text-left">&copy; 2025 InkFlow. Paris, France.</p>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 font-medium">
            <a href="#" className="hover:text-neutral-900 transition-colors duration-200">Confidentialité</a>
            <a href="#" className="hover:text-neutral-900 transition-colors duration-200">Mentions légales</a>
            <a href="#" className="hover:text-neutral-900 transition-colors duration-200">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
