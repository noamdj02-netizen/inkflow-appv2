import React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  Calendar,
  Palette,
  Zap,
  Inbox,
  CreditCard,
  Store,
  MessageSquare,
  BarChart3,
  Award,
  type LucideIcon,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { LandingSectionHeader, LANDING_GLASS } from './landingUi';
import {
  buildMotionVariants,
  EASE_OUT,
  LANDING_VIEWPORT,
  SPRING_SNAPPY,
  SPRING_SOFT,
} from './landingMotion';

/** Grille bento 9 features — rythme alterné puis trio final. */
const BENTO_SPAN = [
  'md:col-span-7',
  'md:col-span-5',
  'md:col-span-5',
  'md:col-span-7',
  'md:col-span-6',
  'md:col-span-6',
  'md:col-span-4',
  'md:col-span-4',
  'md:col-span-4',
] as const;

const ACCENT_GLOW = [
  'from-emerald-400/22 to-transparent',
  'from-zinc-400/16 to-transparent',
  'from-amber-400/18 to-transparent',
  'from-blue-400/14 to-transparent',
  'from-emerald-500/16 to-transparent',
  'from-violet-400/12 to-transparent',
  'from-sky-400/14 to-transparent',
  'from-rose-400/12 to-transparent',
  'from-teal-400/14 to-transparent',
] as const;

function FeatureGlassCard({
  icon: Icon,
  title,
  text,
  spanClass,
  glowClass,
  reduceMotion,
  index,
  parallax,
  cardVariants,
  contentVariants,
}: {
  key?: React.Key;
  icon: LucideIcon;
  title: string;
  text: string;
  spanClass: string;
  glowClass: string;
  reduceMotion: boolean | null;
  index: number;
  parallax?: boolean;
  cardVariants: Variants;
  contentVariants: Variants;
}) {
  return (
    <motion.article
      variants={cardVariants}
      className={`group relative ${spanClass}`}
      style={{ transformPerspective: 1200, transformStyle: 'preserve-3d' }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -10,
              scale: 1.015,
              rotateX: 4,
              rotateY: index % 2 === 0 ? -3 : 3,
              transition: SPRING_SNAPPY,
            }
      }
      whileTap={reduceMotion ? undefined : { scale: 0.985, transition: { duration: 0.12 } }}
    >
      <motion.div
        className={`${LANDING_GLASS} flex h-full min-h-[168px] flex-col justify-between gap-6 p-6 sm:p-8 transition-shadow duration-300 [@media(hover:hover)]:hover:shadow-[0_32px_72px_-28px_rgba(9,9,11,0.18)]`}
        {...(parallax
          ? {
              'data-gsap-scrub': true,
              'data-gsap-scrub-y': '16',
              'data-gsap-scrub-scale': '0.015',
            }
          : {})}
      >
        <motion.div
          className={`pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full bg-gradient-to-br ${glowClass} blur-2xl`}
          aria-hidden
          initial={{ opacity: 0.55, scale: 0.9 }}
          animate={
            reduceMotion
              ? { opacity: 0.65, scale: 1 }
              : { opacity: [0.55, 0.85, 0.55], scale: [0.92, 1.06, 0.92] }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 5 + index * 0.35, repeat: Infinity, ease: 'easeInOut' }
          }
          whileHover={reduceMotion ? undefined : { opacity: 1, scale: 1.12 }}
        />

        <motion.div className="relative flex items-start gap-4" variants={contentVariants}>
          <motion.div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-200/80 bg-white/90 text-zinc-900 shadow-[0_12px_32px_-16px_rgba(9,9,11,0.25)] ring-1 ring-white/80 backdrop-blur-sm"
            whileHover={
              reduceMotion
                ? undefined
                : { y: -3, scale: 1.08, rotate: -6, transition: SPRING_SNAPPY }
            }
          >
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -2, 0] }}
              transition={
                reduceMotion
                  ? undefined
                  : {
                      duration: 2.8,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: index * 0.15,
                    }
              }
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </motion.div>
          </motion.div>
          <div className="min-w-0 flex-1 pt-0.5">
            <motion.h3
              className="text-lg font-bold tracking-tight text-zinc-950 sm:text-xl"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.08 + index * 0.03, ease: EASE_OUT }}
            >
              {title}
            </motion.h3>
            <motion.p
              className="mt-2 max-w-[42ch] text-sm leading-relaxed text-zinc-600 sm:text-[15px]"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.12 + index * 0.03, ease: EASE_OUT }}
            >
              {text}
            </motion.p>
          </div>
        </motion.div>

        <motion.div
          className="relative h-1 origin-left rounded-full bg-gradient-to-r from-zinc-900/80 to-zinc-900/10"
          initial={{ width: 48, opacity: 0.6 }}
          whileInView={reduceMotion ? undefined : { width: 48, opacity: 1 }}
          viewport={{ once: true }}
          whileHover={reduceMotion ? undefined : { width: 96, opacity: 1 }}
          transition={SPRING_SOFT}
          aria-hidden
        />
      </motion.div>
    </motion.article>
  );
}

export const EnhanceAIHowInkflow: React.FC = () => {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const {
    headerVariants,
    gridVariants,
    itemVariants: cardVariants,
    contentVariants,
  } = buildMotionVariants(reduceMotion);

  const items = [
    { icon: Calendar, titleKey: 'how.item1.title', textKey: 'how.item1.text' },
    { icon: Palette, titleKey: 'how.item2.title', textKey: 'how.item2.text' },
    { icon: Zap, titleKey: 'how.item3.title', textKey: 'how.item3.text' },
    { icon: Inbox, titleKey: 'how.item4.title', textKey: 'how.item4.text' },
    { icon: CreditCard, titleKey: 'how.item5.title', textKey: 'how.item5.text' },
    { icon: Store, titleKey: 'how.item6.title', textKey: 'how.item6.text' },
    { icon: MessageSquare, titleKey: 'how.item7.title', textKey: 'how.item7.text' },
    { icon: BarChart3, titleKey: 'how.item8.title', textKey: 'how.item8.text' },
    { icon: Award, titleKey: 'how.item9.title', textKey: 'how.item9.text' },
  ] as const;

  return (
    <section
      id="comment-ca-marche"
      data-gsap-section="how"
      className="relative overflow-hidden border-t border-zinc-200/60 bg-[#f6f5f2] px-4 py-16 sm:px-6 sm:py-24 lg:px-10 lg:py-28"
    >
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white/40 to-transparent"
        aria-hidden
        initial={reduceMotion ? false : { opacity: 0 }}
        whileInView={reduceMotion ? undefined : { opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      />
      <motion.div
        className="pointer-events-none absolute -left-24 top-1/4 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl"
        aria-hidden
        animate={reduceMotion ? undefined : { x: [0, 12, 0], y: [0, -8, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -right-16 bottom-8 h-48 w-48 rounded-full bg-zinc-400/10 blur-3xl"
        aria-hidden
        animate={reduceMotion ? undefined : { x: [0, -10, 0], y: [0, 6, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      <div className="relative mx-auto max-w-[1400px]">
        <motion.div
          variants={headerVariants}
          initial={reduceMotion ? false : 'hidden'}
          whileInView={reduceMotion ? undefined : 'visible'}
          viewport={LANDING_VIEWPORT}
        >
          <LandingSectionHeader badge={t('how.badge')} title={t('how.title')} static />
        </motion.div>

        <motion.div
          className="mt-6 grid min-w-0 grid-cols-1 gap-5 md:grid-cols-12 md:gap-6 [perspective:1200px]"
          variants={gridVariants}
          initial={reduceMotion ? false : 'hidden'}
          whileInView={reduceMotion ? undefined : 'visible'}
          viewport={{ ...LANDING_VIEWPORT, margin: '-72px' }}
        >
          {items.map((item, i) => (
            <FeatureGlassCard
              key={item.titleKey}
              icon={item.icon}
              title={t(item.titleKey)}
              text={t(item.textKey)}
              spanClass={BENTO_SPAN[i] ?? 'md:col-span-12'}
              glowClass={ACCENT_GLOW[i] ?? ACCENT_GLOW[0]}
              reduceMotion={reduceMotion}
              index={i}
              parallax={i % 2 === 0}
              cardVariants={cardVariants}
              contentVariants={contentVariants}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};
