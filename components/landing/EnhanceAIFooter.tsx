import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { LANDING_PRICING_URL, LANDING_PRIVACY_URL, LANDING_TERMS_URL, LANDING_LEGAL_URL } from '../../lib/urls';

const exploreLinksConfig = [
  { href: '/vue-ensemble', label: "Vue d'ensemble" },
  { href: '/demandes', label: 'Demandes' },
  { href: '/rendez-vous', label: 'Rendez-vous' },
];

const productLinksConfig = [
  { href: LANDING_PRICING_URL, label: 'Plans & Tarifs' },
];

const galleryLinksConfig = [
  { href: '/galerie-flash', label: 'Flash' },
  { href: '/portfolio', label: 'Portfolio' },
];

export const EnhanceAIFooter: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="relative bg-blue-900 text-white overflow-hidden">
      {/* Filigrane logo */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{
          fontSize: 'clamp(6rem, 20vw, 18rem)',
          fontWeight: 800,
          color: 'rgba(255,255,255,0.04)',
          letterSpacing: '-0.02em',
        }}
      >
        INKFLOW
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 tracking-tight"
        >
          {t('footer.cta')}
        </motion.h2>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row gap-3 max-w-xl mb-16"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            placeholder={t('footer.emailPlaceholder')}
            className="flex-1 px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-blue-200/70 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
          />
          <a
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-blue-900 font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            {t('footer.signup')}
          </a>
        </motion.form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-200/90 mb-4">Explore</h3>
            <ul className="space-y-2">
              {exploreLinksConfig.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-blue-100 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-200/90 mb-4">Product</h3>
            <ul className="space-y-2">
              {productLinksConfig.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-blue-100 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-200/90 mb-4">Gallery</h3>
            <ul className="space-y-2">
              {galleryLinksConfig.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-blue-100 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

          <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-blue-100">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2">
            <a href={LANDING_PRIVACY_URL} className="hover:text-white transition-colors">
              Politique de confidentialité
            </a>
            <span className="text-blue-300/80 hidden sm:inline">|</span>
            <a href={LANDING_TERMS_URL} className="hover:text-white transition-colors">
              Conditions d&apos;utilisation
            </a>
            <span className="text-blue-300/80 hidden sm:inline">|</span>
            <a href={LANDING_LEGAL_URL} className="hover:text-white transition-colors">
              Mentions légales
            </a>
          </div>
          <p className="text-blue-100/90 font-medium">
            ©2026 InkFlow. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};
