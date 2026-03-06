import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';

const exploreLinksConfig = [
  { href: '/vue-ensemble', key: 'nav.overview' },
  { href: '/demandes', key: 'nav.requests' },
  { href: '/rendez-vous', key: 'nav.appointments' },
];

const productLinksConfig = [
  { href: '/#pricing', key: 'footer.pricing' },
];

const galleryLinksConfig = [
  { href: '/galerie-flash', key: 'footer.flash' },
  { href: '/portfolio', key: 'footer.portfolio' },
];

export const EnhanceAIFooter: React.FC = () => {
  const { t } = useLanguage();
  const exploreLinks = exploreLinksConfig.map((l) => ({ ...l, label: t(l.key) }));
  const productLinks = productLinksConfig.map((l) => ({ ...l, label: t(l.key) }));
  const galleryLinks = galleryLinksConfig.map((l) => ({ ...l, label: t(l.key) }));

  return (
    <footer className="relative bg-neutral-900 text-white overflow-hidden">
      {/* Massive logo watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{
          fontSize: 'clamp(6rem, 20vw, 18rem)',
          fontWeight: 800,
          color: 'rgba(255,255,255,0.03)',
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
            className="flex-1 px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <a
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors whitespace-nowrap"
          >
            {t('footer.signup')}
          </a>
        </motion.form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">{t('footer.explore')}</h3>
            <ul className="space-y-2">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-neutral-300 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">{t('footer.product')}</h3>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-neutral-300 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">{t('footer.gallery')}</h3>
            <ul className="space-y-2">
              {galleryLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-neutral-300 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-neutral-400">
          <div className="flex gap-6">
            <a href="/politique-confidentialite" className="hover:text-white transition-colors">
              {t('footer.privacy')}
            </a>
            <a href="/conditions-utilisation" className="hover:text-white transition-colors">
              {t('footer.terms')}
            </a>
          </div>
          <p>©{new Date().getFullYear()} InkFlow. {t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
};
