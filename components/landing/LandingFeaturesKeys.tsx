import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Calendar, MessageCircle, Image, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { key: 'landing.features.key1', icon: Calendar },
  { key: 'landing.features.key2', icon: MessageCircle },
  { key: 'landing.features.key3', icon: Image },
  { key: 'landing.features.key4', icon: CreditCard },
];

export const LandingFeaturesKeys: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#FAFAFA]" id="fonctionnalites">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center mb-12 sm:mb-16"
        >
          {t('landing.features.title')}
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {features.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-4 p-6 sm:p-8 rounded-2xl bg-white border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 transition-shadow"
              >
                <div className="shrink-0 w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-base sm:text-lg font-semibold text-neutral-900 pt-1">
                  {t(item.key)}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
