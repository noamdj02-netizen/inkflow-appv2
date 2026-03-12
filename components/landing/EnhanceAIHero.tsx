import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08 + 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

/** Mockup téléphone tenu par des mains — image complète (fond transparent) */
const MOCKUP_HANDS_SRC = '/images/hero-mockup-hands.png';

const HandWithPhone: React.FC = () => {
  const [useFallback, setUseFallback] = React.useState(false);

  return (
    <motion.div
      className="relative flex items-center justify-center min-h-[320px] sm:min-h-[360px] lg:min-h-[400px]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {useFallback ? (
        <motion.div
          className="relative z-10 w-[240px] sm:w-[260px] lg:w-[300px] rounded-[2.75rem] bg-neutral-800 p-2.5 sm:p-3"
          style={{
            boxShadow: '0 32px 64px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset',
            transform: 'rotate(-4deg)',
          }}
          whileHover={{ scale: 1.03, rotate: -2 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-neutral-800 rounded-b-2xl z-20" />
          <div className="relative overflow-hidden rounded-[2.25rem] bg-white aspect-[9/19.5]">
            <img
              src="/images/mockup-profil.png"
              alt=""
              width={300}
              height={650}
              className="w-full h-full object-cover object-top"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </motion.div>
      ) : (
        <motion.img
          src={MOCKUP_HANDS_SRC}
          alt="Application InkFlow sur smartphone tenu par des mains"
          className="relative z-10 w-[280px] sm:w-[320px] lg:w-[360px] h-auto object-contain drop-shadow-2xl"
          style={{ transform: 'rotate(-3deg)' }}
          whileHover={{ scale: 1.02, rotate: -1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          loading="eager"
          fetchPriority="high"
          onError={() => setUseFallback(true)}
        />
      )}
    </motion.div>
  );
};

export const EnhanceAIHero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section
      className="relative min-h-0 lg:min-h-[85vh] flex flex-col lg:flex-none lg:flex lg:items-center overflow-hidden bg-[#FAFAFA] pt-20 pb-12 sm:pt-24 sm:pb-16 lg:pt-28 lg:pb-24"
      style={{
        backgroundImage: `
          radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0),
          radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)
        `,
        backgroundSize: '32px 32px',
        backgroundPosition: '0 0, 16px 16px',
      }}
    >
      {/* Gradient orbe subtil en arrière-plan */}
      <div
        className="absolute top-1/4 -right-32 w-96 h-96 rounded-full opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute bottom-1/4 -left-24 w-72 h-72 rounded-full opacity-25 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-12 xl:gap-16">
          {/* Gauche : badge, titre, sous-titre, features, CTAs, social proof */}
          <motion.div
            className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl lg:max-w-none"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-semibold mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" aria-hidden />
              +200 tatoueurs utilisent Inkflow en France
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-hero-title text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-5 sm:mb-6"
            >
              Vos DMs Instagram
              <br />
              transformés en rendez-vous
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-base sm:text-lg md:text-xl text-slate-600 max-w-xl mx-auto lg:mx-0 mb-6 leading-relaxed"
            >
              Inkflow qualifie vos demandes, encaisse les acomptes et gère votre agenda. Vous, vous tatouez.
            </motion.p>

            {/* Features bullets */}
            <motion.ul
              variants={stagger}
              className="flex flex-col gap-3 mb-8 sm:mb-10 text-left mx-auto lg:mx-0"
            >
              {[
                t('hero.feature1'),
                t('hero.feature2'),
                t('hero.feature3'),
              ].map((label, i) => (
                <motion.li
                  key={i}
                  variants={fadeUp}
                  custom={3 + i}
                  className="flex items-center gap-3 text-slate-700 font-medium"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
                  </span>
                  {label}
                </motion.li>
              ))}
            </motion.ul>

            <motion.div
              variants={fadeUp}
              custom={6}
              className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-6 w-full sm:w-auto"
            >
              <motion.a
                href="/demo"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-zinc-900 text-white font-semibold text-base shadow-lg hover:bg-zinc-800 transition-colors min-h-[48px]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Essayer gratuitement
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </motion.a>
              <motion.a
                href="/demo"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 font-semibold text-base hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all min-h-[48px]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Voir une démo
              </motion.a>
            </motion.div>

            {/* Stats bar */}
            <motion.p
              variants={fadeUp}
              custom={7}
              className="text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3"
            >
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2.5} />
                14 jours d&apos;essai gratuit
              </span>
              <span className="hidden sm:inline" aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2.5} />
                Sans carte bancaire
              </span>
              <span className="hidden sm:inline" aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2.5} />
                Annulation à tout moment
              </span>
            </motion.p>
          </motion.div>

          {/* Droite : main + mockup iPhone (desktop) */}
          <div className="hidden lg:flex lg:flex-shrink-0 lg:items-center lg:justify-center">
            <HandWithPhone />
          </div>
        </div>

        {/* Mobile : main + mockup iPhone centré sous le bloc gauche */}
        <div className="lg:hidden mt-8 flex justify-center">
          <HandWithPhone />
        </div>
      </div>
    </section>
  );
};
