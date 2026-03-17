/**
 * Footer dédié à la page /installer — liens in-app (app.ink-flow.me)
 */
import React from 'react';
import { LANDING_PRIVACY_URL, LANDING_TERMS_URL } from '../../lib/urls';

export const InstallerFooter: React.FC = () => (
  <footer className="relative bg-neutral-900 text-white overflow-hidden">
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-neutral-400">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <a href="/login" className="hover:text-white transition-colors">
            Connexion
          </a>
          <a href="/signup" className="hover:text-white transition-colors">
            Essai gratuit
          </a>
          <a href="/" className="hover:text-white transition-colors">
            Accueil
          </a>
          <span className="hidden sm:inline text-neutral-600">|</span>
          <a href={LANDING_PRIVACY_URL} className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
            Confidentialité
          </a>
          <a href={LANDING_TERMS_URL} className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
            Conditions
          </a>
        </div>
        <p className="text-neutral-500 font-medium">©2026 InkFlow</p>
      </div>
    </div>
  </footer>
);
