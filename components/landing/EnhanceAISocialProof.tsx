import React from 'react';
import { motion } from 'framer-motion';

const LOGOS = [
  'HEIRESS',
  'TOZO',
  'HELLBABES',
  'cocokind',
  'Oxyfresh',
  'DOT & KEY',
  "Skybag's",
  'Bellefit',
  'AMAZING LACE',
];

export const EnhanceAISocialProof: React.FC = () => {
  return (
    <section className="pt-6 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-8 sm:gap-10 md:gap-14 lg:gap-16"
        >
          {LOGOS.map((name, i) => (
            <div
              key={i}
              className="text-neutral-500 font-semibold text-sm sm:text-base tracking-wide hover:text-neutral-700 transition-colors"
            >
              {name}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
