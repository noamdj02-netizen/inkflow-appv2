import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Smartphone, Apple, Play } from 'lucide-react';

export const LandingAppSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 mb-6"
        >
          <Smartphone className="w-7 h-7" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3"
        >
          {t('landing.app.title')}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-slate-600 text-lg sm:text-xl mb-10"
        >
          {t('landing.app.subtitle')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="https://apps.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition-colors shadow-lg hover:shadow-xl min-w-[180px]"
          >
            <Apple className="w-5 h-5" />
            {t('landing.app.appStore')}
          </a>
          <a
            href="https://play.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-neutral-800 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl min-w-[180px]"
          >
            <Play className="w-5 h-5" />
            {t('landing.app.googlePlay')}
          </a>
        </motion.div>
      </div>
    </section>
  );
};
