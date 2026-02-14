import React from 'react';
import { Twitter, Instagram, Linkedin, Github } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-6 md:mb-0">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
              <span className="text-white font-black italic text-xs">IF.</span>
            </div>
            <span className="text-lg font-bold text-neutral-900">Inkflow</span>
          </div>

          <div className="flex space-x-8 text-neutral-400">
            <a href="#" className="hover:text-black transition-colors"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="hover:text-black transition-colors"><Instagram className="w-5 h-5" /></a>
            <a href="#" className="hover:text-black transition-colors"><Linkedin className="w-5 h-5" /></a>
            <a href="#" className="hover:text-black transition-colors"><Github className="w-5 h-5" /></a>
          </div>
        </div>

        <div className="mt-12 flex flex-col md:flex-row justify-between items-center text-sm text-neutral-500 border-t border-neutral-100 pt-8">
          <p>&copy; 2024 Inkflow Inc. Paris, France.</p>
          <div className="flex space-x-8 mt-4 md:mt-0 font-medium">
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Terms</a>
            <a href="#" className="hover:text-black transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
