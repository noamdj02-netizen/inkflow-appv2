import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';

export const EnhanceAISocialProof: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="py-12 sm:py-16 bg-white border-y border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-lg sm:text-xl text-slate-700 font-medium mb-4"
        >
          {t('hero.social')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm font-semibold text-slate-700 shadow-sm"
        >
          {t('hero.socialBadge')}
        </motion.div>
      </div>
    </section>
  );
};
