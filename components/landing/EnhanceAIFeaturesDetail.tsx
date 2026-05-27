import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  CreditCard,
  Users,
  BarChart3,
  FileText,
  Image,
  Store,
  CheckCircle,
  Bell,
  Shield,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { LandingSectionHeader, LandingAppScreenshot, LANDING_SURFACE } from './landingUi';

interface FeatureItem {
  icon: LucideIcon;
  label: string;
}

interface DetailSectionConfig {
  title: string;
  description: string;
  features: FeatureItem[];
  reverse?: boolean;
  screenshot: {
    src: string;
    webpSrc?: string;
    alt: string;
    imgClassName?: string;
    frameClassName?: string;
    backdropClassName?: string;
  };
  caption?: string;
}

function getSections(t: (k: string) => string): DetailSectionConfig[] {
  return [
    {
      title: t('features.section1.title'),
      description: t('features.section1.desc'),
      features: [
        { icon: Calendar, label: t('features.section1.f1') },
        { icon: CreditCard, label: t('features.section1.f2') },
        { icon: Users, label: t('features.section1.f3') },
        { icon: BarChart3, label: t('features.section1.f4') },
      ],
      screenshot: {
        src: '/Mobile_Mockup_2.1.png',
        alt: 'Aperçu mobile InkFlow Pro',
        imgClassName: 'object-center',
      },
      caption: t('features.section1.visualTitle'),
    },
    {
      title: t('features.section2.title'),
      description: t('features.section2.desc'),
      features: [
        { icon: Users, label: t('features.section2.f1') },
        { icon: FileText, label: t('features.section2.f2') },
        { icon: Bell, label: t('features.section2.f3') },
        { icon: BarChart3, label: t('features.section2.f4') },
      ],
      reverse: true,
      screenshot: {
        src: '/ë.png',
        alt: 'Application InkFlow — fiche client et historique',
        imgClassName: 'object-center',
      },
      caption: t('features.section2.visualTitle'),
    },
    {
      title: t('features.section3.title'),
      description: t('features.section3.desc'),
      features: [
        { icon: CreditCard, label: t('features.section3.f1') },
        { icon: Shield, label: t('features.section3.f2') },
        { icon: CheckCircle, label: t('features.section3.f3') },
        { icon: Bell, label: t('features.section3.f4') },
      ],
      screenshot: {
        src: '/Mobile_Mockup_2.2.jpg',
        alt: 'InkFlow — paiements Stripe et suivi des acomptes',
        imgClassName: 'object-center',
      },
      caption: t('features.section3.visualTitle'),
    },
    {
      title: t('features.section4.title'),
      description: t('features.section4.desc'),
      features: [
        { icon: Image, label: t('features.section4.f1') },
        { icon: Store, label: t('features.section4.f2') },
        { icon: Sparkles, label: t('features.section4.f3') },
        { icon: CreditCard, label: t('features.section4.f4') },
      ],
      reverse: true,
      screenshot: {
        src: '/images/azzzzssss.png',
        alt: 'Vitrine et réservation en ligne InkFlow',
        imgClassName: 'object-contain scale-[0.84] transform-gpu object-center',
        frameClassName:
          'bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.22),transparent_70%)]',
        backdropClassName:
          'inset-x-[10%] inset-y-[12%] rounded-[1.75rem] border border-zinc-200/90 bg-white shadow-[0_32px_90px_-42px_rgba(9,9,11,0.28)]',
      },
      caption: t('features.section4.visualTitle'),
    },
  ];
}

function FeatureScreenshot({ config, index }: { config: DetailSectionConfig; index: number }) {
  return (
    <motion.figure
      initial={{ opacity: 0, x: config.reverse ? -20 : 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`relative ${index === 0 ? 'lg:-mt-4' : index === 2 ? 'lg:mt-6' : ''}`}
    >
      <div className={`${LANDING_SURFACE} overflow-hidden p-2 sm:p-3`}>
        <LandingAppScreenshot
          src={config.screenshot.src}
          webpSrc={config.screenshot.webpSrc}
          alt={config.screenshot.alt}
          imgClassName={config.screenshot.imgClassName}
          frameClassName={config.screenshot.frameClassName}
          backdropClassName={config.screenshot.backdropClassName}
          className="aspect-[4/3] sm:aspect-[16/10]"
          priority={index === 0}
        />
      </div>
      {config.caption ? (
        <figcaption className="mt-4 text-sm font-medium text-zinc-500">{config.caption}</figcaption>
      ) : null}
      {index === 0 ? (
        <motion.div
          className="absolute -bottom-3 -left-2 rounded-2xl border border-zinc-200/90 bg-white px-3 py-2 shadow-[0_12px_28px_-12px_rgba(9,9,11,0.12)] sm:-left-4"
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Agenda</p>
          <p className="text-xs font-bold tabular-nums text-zinc-900">+3 RDV cette semaine</p>
        </motion.div>
      ) : null}
    </motion.figure>
  );
}

function FeatureTextBlock({ config }: { config: DetailSectionConfig }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: config.reverse ? 20 : -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="min-w-0"
    >
      <h2 className="font-hero-title text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl md:text-4xl">
        {config.title}
      </h2>
      <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-zinc-600 sm:text-lg">
        {config.description}
      </p>
      <ul className="mt-8 space-y-3">
        {config.features.map((f, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-xl border border-transparent py-1 transition-colors hover:border-zinc-200/80 hover:bg-white/60"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
              <f.icon className="h-5 w-5 text-zinc-800" strokeWidth={2} />
            </div>
            <span className="font-medium text-zinc-800">{f.label}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export const EnhanceAIFeaturesDetail: React.FC = () => {
  const { t } = useLanguage();
  const sections = getSections(t);

  return (
    <div id="fonctionnalites" className="w-full overflow-x-hidden bg-[#f6f5f2]">
      <section className="border-t border-zinc-200/60 px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1400px]">
          <LandingSectionHeader
            badge={t('nav.features')}
            title={t('landing.features.title')}
            description={t('landing.features.subtitle')}
          />
        </div>
      </section>

      {sections.map((config, idx) => (
        <section
          key={idx}
          className={`px-4 py-14 sm:px-6 sm:py-20 lg:px-10 ${
            idx % 2 === 1 ? 'bg-white/50' : 'bg-[#f6f5f2]'
          }`}
        >
          <div className="mx-auto grid max-w-[1400px] min-w-0 grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-20">
            {config.reverse ? (
              <>
                <div className="lg:order-2">
                  <FeatureTextBlock config={config} />
                </div>
                <div className="lg:order-1">
                  <FeatureScreenshot config={config} index={idx} />
                </div>
              </>
            ) : (
              <>
                <FeatureTextBlock config={config} />
                <FeatureScreenshot config={config} index={idx} />
              </>
            )}
          </div>
        </section>
      ))}
    </div>
  );
};
