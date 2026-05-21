import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Palette, Zap } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { LandingSectionHeader, LANDING_SURFACE } from './landingUi';

export const EnhanceAIHowInkflow: React.FC = () => {
  const { t } = useLanguage();
  const items = [
    { icon: Calendar, titleKey: 'how.item1.title', textKey: 'how.item1.text' },
    { icon: Palette, titleKey: 'how.item2.title', textKey: 'how.item2.text' },
    { icon: Zap, titleKey: 'how.item3.title', textKey: 'how.item3.text' },
  ];

  return (
    <section
      id="comment-ca-marche"
      className="border-t border-zinc-200/60 bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-10 lg:py-28"
    >
      <div className="mx-auto max-w-[1400px]">
        <LandingSectionHeader badge={t('how.badge')} title={t('how.title')} />

        <div className="mt-4 grid min-w-0 grid-cols-1 gap-6 md:gap-8 lg:grid-cols-2">
          {items.map((item, i) => (
            <motion.article
              key={item.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`${LANDING_SURFACE} flex min-w-0 flex-col gap-5 p-6 sm:p-8 ${
                i === 2 ? 'lg:col-span-2 lg:max-w-[calc(50%-1rem)]' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                  <item.icon className="h-6 w-6" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold tracking-tight text-zinc-950 sm:text-xl">
                    {t(item.titleKey)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 sm:text-base">
                    {t(item.textKey)}
                  </p>
                </div>
              </div>
              <span className="font-mono text-[11px] font-medium tabular-nums text-zinc-400">
                0{i + 1}
              </span>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
