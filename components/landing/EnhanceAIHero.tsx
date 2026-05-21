import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { LandingHeroProductStage } from './LandingHeroProductStage';
import { LandingHeroMarquee } from './LandingHeroMarquee';

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07 + 0.12, duration: 0.55, ease },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

export const EnhanceAIHero: React.FC = () => {
  const { t } = useLanguage();

  const features = [t('hero.feature1'), t('hero.feature2'), t('hero.feature3')];

  return (
    <section className="landing-hero relative flex min-h-[100dvh] w-full min-w-0 flex-col overflow-hidden pt-[calc(4.25rem+env(safe-area-inset-top,0px))] pb-16 sm:pb-20 lg:pb-24">
      <div className="landing-hero-mesh pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div className="grid min-w-0 grid-cols-1 items-center gap-12 sm:gap-14 lg:grid-cols-2 lg:gap-12 xl:gap-20">
          <motion.div
            className="flex min-w-0 flex-col items-start justify-center text-left lg:max-w-[34rem] lg:py-4 xl:max-w-[36rem]"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-200/90 bg-white/70 py-1.5 pl-1.5 pr-3.5 text-xs font-semibold text-zinc-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-sm"
            >
              <span className="flex h-6 items-center rounded-full bg-zinc-900 px-2.5 text-[10px] font-bold uppercase tracking-wider text-white">
                InkFlow
              </span>
              <span className="h-1 w-1 rounded-full bg-emerald-500" aria-hidden />
              <span className="text-zinc-600">Centaines de studios en France</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-hero-title max-w-[14ch] text-[2.35rem] font-extrabold leading-[1.02] tracking-tighter text-zinc-950 sm:text-5xl lg:text-[3.35rem] xl:text-[3.65rem]"
            >
              Les demandes Insta
              <span className="block text-zinc-500">qui deviennent des RDV.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-5 max-w-[52ch] text-base leading-relaxed text-zinc-600 sm:text-lg"
            >
              Tu qualifies en deux clics, l&apos;acompte part sur Stripe, le créneau se bloque dans
              ton agenda. Moins de DM, plus de temps à la machine.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="mt-7 flex w-full flex-wrap gap-2 sm:gap-2.5"
            >
              {features.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/90 bg-white/80 px-3 py-2 text-xs font-medium text-zinc-800 shadow-sm backdrop-blur-sm sm:text-sm"
                >
                  <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2.5} />
                  {label}
                </span>
              ))}
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={4}
              className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:items-center"
            >
              <motion.a
                href="/signup"
                className="group inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_16px_32px_-12px_rgba(9,9,11,0.45)] transition-colors hover:bg-zinc-800 sm:w-auto"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Essayer gratuitement
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </motion.a>
              <motion.a
                href="/dashboard-demo"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-zinc-200 bg-white/80 px-7 py-3.5 text-sm font-semibold text-zinc-900 backdrop-blur-sm transition-colors hover:bg-zinc-50 sm:w-auto"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Voir une démo
              </motion.a>
            </motion.div>

            <motion.p
              variants={fadeUp}
              custom={5}
              className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500"
            >
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
                {t('hero.trialTrust')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
                Sans carte
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
                Annulation libre
              </span>
            </motion.p>
          </motion.div>

          <motion.div
            className="relative flex min-w-0 items-center justify-center pt-4 sm:pt-6 lg:justify-center lg:pt-12 xl:pt-16"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease }}
          >
            <LandingHeroProductStage />
          </motion.div>
        </div>

        <LandingHeroMarquee />
      </div>
    </section>
  );
};
