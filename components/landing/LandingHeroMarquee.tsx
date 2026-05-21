import React from 'react';
import { motion } from 'framer-motion';

const CITIES = [
  'Paris',
  'Lyon',
  'Marseille',
  'Bordeaux',
  'Lille',
  'Toulouse',
  'Nantes',
  'Strasbourg',
  'Montpellier',
  'Rennes',
];

export const LandingHeroMarquee: React.FC = () => {
  const track = [...CITIES, ...CITIES];

  return (
    <div className="relative mt-14 sm:mt-16 border-t border-zinc-200/80 pt-8 overflow-hidden">
      <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
        Studios actifs en France
      </p>
      <div className="relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <motion.div
          className="flex shrink-0 gap-10 pr-10"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        >
          {track.map((city, i) => (
            <span
              key={`${city}-${i}`}
              className="whitespace-nowrap text-sm font-medium text-zinc-500"
            >
              {city}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
