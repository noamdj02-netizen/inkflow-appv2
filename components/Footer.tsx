import React from 'react';
import { Instagram, Mail } from 'lucide-react';
import { Logo } from './Logo';
import { LANDING_URL, INKFLOW_INSTAGRAM_URL, APP_COOKIES_PATH } from '../lib/urls';
import { supportMailto, SUPPORT_EMAIL } from '../lib/supportContact';
import { openCookieSettings } from '../lib/cookieConsentStorage';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 safe-bottom">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <a href={LANDING_URL} className="flex items-center gap-3">
              <Logo size="sm" />
              <span className="text-lg font-bold text-neutral-900 tracking-tight">InkFlow</span>
            </a>
          </div>

          <div className="flex gap-6 text-neutral-400">
            <a
              href={INKFLOW_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram InkFlow"
              className="hover:text-neutral-900 transition-colors duration-200 p-2 rounded-lg hover:bg-neutral-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href={supportMailto()}
              aria-label="Contacter le support par email"
              className="hover:text-neutral-900 transition-colors duration-200 p-2 rounded-lg hover:bg-neutral-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="mt-10 sm:mt-14 flex flex-col md:flex-row justify-between items-center text-sm text-neutral-500 border-t border-neutral-200/80 pt-8 sm:pt-10 gap-6">
          <p className="text-center md:text-left">
            &copy; {new Date().getFullYear()} InkFlow. Paris, France.
          </p>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 font-medium">
            <a
              href="/politique-confidentialite"
              className="hover:text-neutral-900 transition-colors duration-200"
            >
              Politique de confidentialité
            </a>
            <a
              href="/conditions-utilisation"
              className="hover:text-neutral-900 transition-colors duration-200"
            >
              CGU &amp; CGV
            </a>
            <a
              href="/mentions-legales"
              className="hover:text-neutral-900 transition-colors duration-200"
            >
              Mentions légales
            </a>
            <a
              href={APP_COOKIES_PATH}
              className="hover:text-neutral-900 transition-colors duration-200"
            >
              Politique cookies
            </a>
            <button
              type="button"
              onClick={() => openCookieSettings()}
              className="hover:text-neutral-900 transition-colors duration-200 text-left"
            >
              Gérer les cookies
            </button>
            <a href="/aide" className="hover:text-neutral-900 transition-colors duration-200">
              Aide
            </a>
            <a
              href="/quoi-de-neuf"
              className="hover:text-neutral-900 transition-colors duration-200"
            >
              Nouveautés
            </a>
            <a
              href={supportMailto('Support InkFlow')}
              className="hover:text-neutral-900 transition-colors duration-200"
            >
              Support {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
