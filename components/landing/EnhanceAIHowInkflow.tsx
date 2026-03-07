import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Palette, Zap } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const EnhanceAIHowInkflow: React.FC = () => {
  const { t } = useLanguage();
  const items = [
    { icon: Calendar, titleKey: 'how.item1.title', textKey: 'how.item1.text', gradient: 'from-blue-500 to-blue-600' },
    { icon: Palette, titleKey: 'how.item2.title', textKey: 'how.item2.text', gradient: 'from-blue-500 to-sky-600' },
    { icon: Zap, titleKey: 'how.item3.title', textKey: 'how.item3.text', gradient: 'from-sky-500 to-blue-600' },
  ];
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">{t('how.badge')}</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-800">
            {t('how.title')}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group text-center"
            >
              <div
                className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300`}
              >
                <item.icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-3">{t(item.titleKey)}</h3>
              <p className="text-neutral-600 leading-relaxed">{t(item.textKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
