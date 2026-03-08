import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export const EnhanceAIFooter: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-sm">
          <nav className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2">
            <a
              href="/mentions-legales"
              className="text-neutral-300 hover:text-white transition-colors"
            >
              {t('footer.legal')}
            </a>
            <span className="text-neutral-500">|</span>
            <a
              href="/conditions-utilisation"
              className="text-neutral-300 hover:text-white transition-colors"
            >
              {t('footer.termsShort')}
            </a>
            <span className="text-neutral-500">|</span>
            <a
              href="/contact"
              className="text-neutral-300 hover:text-white transition-colors"
            >
              {t('footer.contact')}
            </a>
          </nav>
          <p className="text-neutral-400 font-medium">
            {t('footer.copyrightYear')}
          </p>
        </div>
      </div>
    </footer>
  );
};
