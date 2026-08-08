import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  LandingMotionItem,
  LandingMotionReveal,
  LandingMotionStagger,
  SPRING_SNAPPY,
} from './landingMotion';

const faqKeys = [
  { q: 'faq.q1', a: 'faq.a1' },
  { q: 'faq.q2', a: 'faq.a2' },
  { q: 'faq.q3', a: 'faq.a3' },
  { q: 'faq.q4', a: 'faq.a4' },
  { q: 'faq.q5', a: 'faq.a5' },
];

export const EnhanceAIFAQ: React.FC = () => {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqs = faqKeys.map((k) => ({ question: t(k.q), answer: t(k.a) }));

  return (
    <section
      id="faq"
      className="border-t border-zinc-200/60 bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-10 lg:py-28"
    >
      <div className="mx-auto max-w-3xl">
        <LandingMotionReveal as="header">
          <h2 className="font-hero-title mb-12 text-center text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            {t('faq.title')}
          </h2>
        </LandingMotionReveal>

        <LandingMotionStagger className="space-y-3" stagger={0.06}>
          {faqs.map((faq, index) => (
            <LandingMotionItem
              key={index}
              index={index}
              className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white transition-colors [@media(hover:hover)]:border-zinc-300/80"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex min-h-[56px] w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={openIndex === index}
              >
                <span className="pr-4 font-semibold text-zinc-900">{faq.question}</span>
                <motion.span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-800 ${
                    openIndex === index ? 'rotate-45' : ''
                  }`}
                  whileHover={reduceMotion ? undefined : { scale: 1.08, transition: SPRING_SNAPPY }}
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </motion.span>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-0">
                      <p className="leading-relaxed text-zinc-600">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </LandingMotionItem>
          ))}
        </LandingMotionStagger>
      </div>
    </section>
  );
};
