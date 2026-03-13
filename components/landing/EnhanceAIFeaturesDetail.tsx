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

interface FeatureItem {
  icon: LucideIcon;
  label: string;
}

interface TimelineItem {
  label: string;
  value: number;
  color: string;
}

interface DetailSectionConfig {
  title: string;
  description: string;
  features: FeatureItem[];
  visualType: 'timeline' | 'stats' | 'list' | 'checklist';
  visualData?: TimelineItem[] | string[] | { label: string; value: string }[];
  visualTitle?: string;
  visualIcon?: LucideIcon;
  reverse?: boolean;
  files?: string[];
}

const glassCardStyle = {
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255,255,255,0.5) inset',
};

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
      visualType: 'timeline' as const,
      visualTitle: t('features.section1.visualTitle'),
      visualIcon: BarChart3,
      visualData: [
        { label: t('features.section1.v1'), value: 60, color: 'bg-blue-500' },
        { label: t('features.section1.v2'), value: 40, color: 'bg-amber-400' },
        { label: t('features.section1.v3'), value: 10, color: 'bg-emerald-500' },
      ] as TimelineItem[],
      files: [t('features.file1'), t('features.file2'), t('features.file3')],
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
      visualType: 'list' as const,
      visualTitle: t('features.section2.visualTitle'),
      visualIcon: Users,
      visualData: [t('features.section2.v1'), t('features.section2.v2'), t('features.section2.v3')],
      reverse: true,
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
      visualType: 'stats' as const,
      visualTitle: t('features.section3.visualTitle'),
      visualIcon: CreditCard,
      visualData: [
        { label: t('features.section3.v1'), value: t('features.section3.val1') },
        { label: t('features.section3.v2'), value: t('features.section3.val2') },
        { label: t('features.section3.v3'), value: t('features.section3.val3') },
      ],
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
      visualType: 'checklist' as const,
      visualTitle: t('features.section4.visualTitle'),
      visualIcon: Image,
      visualData: [t('features.section4.v1'), t('features.section4.v2'), t('features.section4.v3')],
      reverse: true,
    },
  ];
}

function VisualCard({ config }: { config: DetailSectionConfig }) {
  const Icon = config.visualIcon ?? BarChart3;

  return (
    <motion.div
      initial={{ opacity: 0, x: config.reverse ? -24 : 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl p-6 shadow-xl border border-white/60"
      style={glassCardStyle}
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <span className="font-semibold text-neutral-800">{config.visualTitle}</span>
      </div>

      {config.visualType === 'timeline' && Array.isArray(config.visualData) && (
        <div className="space-y-4 mb-6">
          {(config.visualData as TimelineItem[]).map((t, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-600">{t.label}</span>
                <span className="font-semibold text-blue-600">{t.value}%</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className={`h-full ${t.color} rounded-full`} style={{ width: `${t.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {config.visualType === 'stats' && Array.isArray(config.visualData) && (
        <div className="space-y-4 mb-6">
          {(config.visualData as { label: string; value: string }[]).map((s, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
              <span className="text-neutral-600">{s.label}</span>
              <span className="font-bold text-blue-600">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {config.visualType === 'list' && Array.isArray(config.visualData) && (
        <div className="space-y-2 mb-6">
          {(config.visualData as string[]).map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-neutral-600 py-2 border-b border-neutral-100 last:border-0">
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      )}

      {config.visualType === 'checklist' && Array.isArray(config.visualData) && (
        <div className="space-y-2 pt-4">
          {(config.visualData as string[]).map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-neutral-600">
              <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      )}

      {config.visualType === 'timeline' && config.files && (
        <div className="space-y-2 pt-4 border-t border-neutral-200/60">
          {config.files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-neutral-600">
              <FileText className="w-4 h-4 text-blue-500" />
              {f}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function TextBlock({ config }: { config: DetailSectionConfig }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: config.reverse ? 24 : -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-800 mb-6 leading-tight">
        {config.title}
      </h2>
      <p className="text-neutral-600 text-lg mb-8 leading-relaxed">{config.description}</p>
      <ul className="space-y-4">
        {config.features.map((f, i) => (
          <li key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <f.icon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-medium text-neutral-800">{f.label}</span>
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
    <>
      {sections.map((config, idx) => (
        <section
          key={idx}
          className={`py-20 sm:py-28 px-4 sm:px-6 lg:px-8 w-full overflow-x-hidden ${
            idx % 2 === 0 ? 'bg-gradient-to-b from-white to-neutral-50/50' : 'bg-neutral-50/50'
          }`}
        >
          <div className="max-w-7xl mx-auto">
            <div
              className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
                config.reverse ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {config.reverse ? (
                <>
                  <div className="lg:order-2">
                    <TextBlock config={config} />
                  </div>
                  <div className="lg:order-1">
                    <VisualCard config={config} />
                  </div>
                </>
              ) : (
                <>
                  <TextBlock config={config} />
                  <VisualCard config={config} />
                </>
              )}
            </div>
          </div>
        </section>
      ))}
    </>
  );
};
