import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Inbox } from 'lucide-react';

const STRIPE_LOGO_SRC = '/images/stripe-logo-circle.png';

/** Mockuuups — PNG avec fond blanc retiré (assets *-transparent) */
const HERO_MOCKUP_WEBP = '/images/hero-mockup-hand-iphone-transparent.webp';
const HERO_MOCKUP_SRC = '/images/hero-mockup-hand-iphone-transparent.png';
const HERO_MOCKUP_FALLBACK = '/images/hero-mockup-hand-iphone.png';

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

const floatY = (delay: number) => ({
  y: [0, -6, 0],
  transition: { duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay },
});

interface LandingHeroProductStageProps {
  className?: string;
}

/**
 * Vitrine hero — mockup main + iPhone, centré et aligné avec la colonne texte.
 */
export const LandingHeroProductStage: React.FC<LandingHeroProductStageProps> = ({
  className = '',
}) => {
  const [useFallback, setUseFallback] = React.useState(false);

  return (
    <div
      className={`relative mx-auto w-full max-w-[min(100%,340px)] sm:max-w-[380px] lg:max-w-[420px] ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <div
          className="h-[72%] w-[85%] opacity-90"
          style={{
            background:
              'radial-gradient(ellipse 65% 55% at 50% 48%, rgba(16, 185, 129, 0.12), transparent 70%)',
          }}
        />
      </div>

      <motion.div
        className="absolute left-0 top-[20%] z-20 sm:left-2"
        animate={floatY(0)}
        initial={{ opacity: 0, x: -8 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={spring}
      >
        <div className="rounded-2xl border border-zinc-200/80 bg-white/92 px-3 py-2 shadow-[0_16px_36px_-14px_rgba(9,9,11,0.12)] backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700">
              <Inbox className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Inbox</p>
              <p className="text-xs font-semibold tabular-nums text-zinc-900">3 demandes</p>
            </div>
            <span className="relative ml-0.5 flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute right-0 top-[42%] z-20 sm:right-2"
        animate={floatY(0.55)}
        initial={{ opacity: 0, x: 8 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ ...spring, delay: 0.08 }}
      >
        <div className="rounded-2xl border border-zinc-200/80 bg-white/92 px-3 py-2.5 shadow-[0_16px_36px_-14px_rgba(9,9,11,0.12)] backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#635BFF]/15 bg-[#635BFF]/[0.07] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <img
                src={STRIPE_LOGO_SRC}
                alt="Stripe"
                width={20}
                height={20}
                className="h-5 w-5 object-contain"
                loading="lazy"
                decoding="async"
              />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-zinc-500">Acompte Stripe</p>
              <p className="text-xs font-semibold tabular-nums text-zinc-900">147,50 €</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-[16%] left-1/2 z-20 -translate-x-1/2"
        animate={floatY(1.1)}
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ ...spring, delay: 0.14 }}
      >
        <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-zinc-200/90 bg-white/95 py-1 pl-1 pr-2.5 shadow-[0_10px_24px_-10px_rgba(9,9,11,0.12)] backdrop-blur-md">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[9px] font-bold text-white">
            RDV
          </span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-700">
            <Calendar className="h-3 w-3 shrink-0 text-zinc-500" strokeWidth={2} />
            Sam. 14 juin · 10:00
          </span>
        </div>
      </motion.div>

      <motion.div
        className="relative z-10 mx-auto flex w-full justify-center py-2 sm:py-4"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -3 }}
      >
        <div className="landing-hero-mockup-stage flex w-full justify-center">
          <picture className="flex justify-center">
            {!useFallback ? <source srcSet={HERO_MOCKUP_WEBP} type="image/webp" /> : null}
            <img
              src={useFallback ? HERO_MOCKUP_FALLBACK : HERO_MOCKUP_SRC}
              alt="InkFlow sur iPhone — accueil tatoueur, agenda et demandes clients"
              width={900}
              height={1279}
              className="landing-hero-mockup-img mx-auto block h-auto w-full max-w-[280px] object-contain object-center sm:max-w-[320px] lg:max-w-[360px] xl:max-w-[400px]"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onError={() => setUseFallback(true)}
            />
          </picture>
        </div>
      </motion.div>
    </div>
  );
};
