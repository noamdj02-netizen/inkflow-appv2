import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const faqKeys = [
  { q: 'faq.q1', a: 'faq.a1' },
  { q: 'faq.q2', a: 'faq.a2' },
  { q: 'faq.q3', a: 'faq.a3' },
  { q: 'faq.q4', a: 'faq.a4' },
  { q: 'faq.q5', a: 'faq.a5' },
];

export const EnhanceAIFAQ: React.FC = () => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqs = faqKeys.map((k) => ({ question: t(k.q), answer: t(k.a) }));

  return (
    <section
      id="faq"
      className="border-t border-zinc-200/60 bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-10 lg:py-28"
    >
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-hero-title mb-12 text-center text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl"
        >
          {t('faq.title')}
        </motion.h2>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="overflow-hidden rounded-2xl border border-zinc-200/80 transition-colors hover:border-zinc-300/80"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left min-h-[56px]"
                aria-expanded={openIndex === index}
              >
                <span className="pr-4 font-semibold text-zinc-900">{faq.question}</span>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-800 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-45' : ''
                  }`}
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                </span>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-0">
                      <p className="leading-relaxed text-zinc-600">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
