import React from 'react';
import { motion } from 'framer-motion';
import { LANDING_HERO_STUDIO_MARQUEE_ENABLED } from '../../lib/landingFlags';

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

/**
 * Bandeau social proof studios — désactivé via `LANDING_HERO_STUDIO_MARQUEE_ENABLED`
 * tant qu’il n’y a pas de studios vérifiables en prod.
 */
export const LandingHeroMarquee: React.FC<{ variant?: 'light' | 'dark' }> = ({
  variant = 'light',
}) => {
  if (!LANDING_HERO_STUDIO_MARQUEE_ENABLED) {
    return null;
  }

  const track = [...CITIES, ...CITIES];
  const isDark = variant === 'dark';

  return (
    <div
      className={`relative mt-14 sm:mt-16 overflow-hidden border-t pt-8 ${
        isDark ? 'border-white/10' : 'border-zinc-200/80'
      }`}
    >
      <p
        className={`mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] ${
          isDark ? 'text-zinc-500' : 'text-zinc-400'
        }`}
      >
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
              className={`whitespace-nowrap text-sm font-medium ${
                isDark ? 'text-zinc-400' : 'text-zinc-500'
              }`}
            >
              {city}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
