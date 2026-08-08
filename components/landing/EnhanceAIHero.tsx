import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { BlurText } from '../react-bits';
import { HeroBackgroundVideo } from '../common/HeroBackgroundVideo';
import { LandingHeroMarquee } from './LandingHeroMarquee';
import { LANDING_HERO_STUDIO_MARQUEE_ENABLED } from '../../lib/landingFlags';
import { SPRING_SNAPPY } from './landingMotion';

const ease = [0.22, 1, 0.36, 1] as const;

const LANDING_HERO_POSTER = '/images/landing-hero-poster.jpg';
const LANDING_HERO_MP4 = '/videos/landing-hero.mp4';
const LANDING_HERO_WEBM = '/videos/landing-hero.webm';

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
  const { t, lang } = useLanguage();
  const reduceMotion = useReducedMotion();

  const features = [t('hero.feature1'), t('hero.feature2'), t('hero.feature3')];

  return (
    <section
      className="landing-hero relative flex min-h-[100dvh] w-full min-w-0 flex-col overflow-hidden pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-16 md:pt-[calc(4.25rem+env(safe-area-inset-top,0px))] sm:pb-20 lg:pb-24"
      data-gsap-hero
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <HeroBackgroundVideo
          posterSrc={LANDING_HERO_POSTER}
          mp4Src={LANDING_HERO_MP4}
          webmSrc={LANDING_HERO_WEBM}
          objectPosition="center"
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/75 via-black/55 to-black/80"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.25]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col items-start justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <motion.div
          className="flex w-full max-w-3xl min-w-0 flex-col items-start text-left"
          data-gsap-hero-content
          data-gsap-scrub-y="28"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 py-1.5 pl-1.5 pr-3.5 text-xs font-semibold text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm"
          >
            <span className="flex h-6 items-center rounded-full bg-white px-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-900">
              InkFlow
            </span>
            <span className="h-1 w-1 rounded-full bg-emerald-400" aria-hidden />
            <span className="text-white/75">{t('hero.badgeAudience')}</span>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            <h1 className="font-hero-title max-w-[14ch] text-left text-[2.35rem] font-extrabold leading-[1.02] tracking-tighter text-white sm:text-5xl lg:text-[3.35rem] xl:text-[3.65rem]">
              <BlurText
                as="span"
                key={`${lang}-line1`}
                text={t('hero.titleLine1')}
                animateOnMount
                delay={90}
                className="max-w-[14ch] text-left text-white"
              />
              <BlurText
                as="span"
                key={`${lang}-line2`}
                text={t('hero.titleLine2')}
                animateOnMount
                delay={70}
                className="block max-w-[14ch] text-left text-zinc-300"
              />
            </h1>
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-5 max-w-[52ch] text-left text-base leading-relaxed text-zinc-300 sm:text-lg"
          >
            {t('hero.subtitleV2')}
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-7 flex w-full flex-wrap justify-start gap-2 text-left sm:gap-2.5"
          >
            {features.map((label, i) => (
              <motion.span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white/90 shadow-sm backdrop-blur-sm sm:text-sm"
                style={{ transformPerspective: 1200 }}
                whileHover={
                  reduceMotion
                    ? undefined
                    : {
                        y: -4,
                        scale: 1.04,
                        rotateX: 3,
                        rotateY: i % 2 === 0 ? -2 : 2,
                        transition: SPRING_SNAPPY,
                      }
                }
              >
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={2.5} />
                {label}
              </motion.span>
            ))}
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={4}
            className="mt-8 flex w-full flex-col items-stretch justify-start gap-3 sm:flex-row sm:items-start sm:justify-start"
          >
            <motion.a
              href="/signup"
              className="group inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-zinc-900 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.45)] transition-colors hover:bg-zinc-100 sm:w-auto sm:justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('hero.ctaTrial')}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </motion.a>
            <motion.a
              href="/dashboard-demo"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15 sm:w-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('hero.ctaDemoShort')}
            </motion.a>
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={5}
            className="mt-5 flex flex-wrap justify-start gap-x-4 gap-y-1 text-left text-xs text-zinc-400"
          >
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2.5} />
              {t('hero.trialTrust')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2.5} />
              {t('hero.noCard')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2.5} />
              {t('hero.cancelFree')}
            </span>
          </motion.p>
        </motion.div>

        {LANDING_HERO_STUDIO_MARQUEE_ENABLED ? <LandingHeroMarquee variant="dark" /> : null}
      </div>
    </section>
  );
};
