import React, { useEffect, lazy, Suspense } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { EnhanceAINavbar } from './EnhanceAINavbar';
import { EnhanceAIHero } from './EnhanceAIHero';
import { LandingMobileStickyCta } from '@/components/mobile/LandingMobileStickyCta';
import { SEO, faqPageSchemaFr } from '../SEO';

const LandingDemoSection = lazy(() =>
  import('./LandingDemoSection').then((m) => ({ default: m.LandingDemoSection }))
);
const EnhanceAIFeaturesDetail = lazy(() =>
  import('./EnhanceAIFeaturesDetail').then((m) => ({ default: m.EnhanceAIFeaturesDetail }))
);
const EnhanceAIHowInkflow = lazy(() =>
  import('./EnhanceAIHowInkflow').then((m) => ({ default: m.EnhanceAIHowInkflow }))
);
const ProcessSection = lazy(() =>
  import('../ProcessSection').then((m) => ({ default: m.ProcessSection }))
);
const PricingSection = lazy(() =>
  import('../PricingSection').then((m) => ({ default: m.PricingSection }))
);
const TestimonialsSection = lazy(() =>
  import('./TestimonialsSection').then((m) => ({ default: m.TestimonialsSection }))
);
const EnhanceAIFAQ = lazy(() =>
  import('./EnhanceAIFAQ').then((m) => ({ default: m.EnhanceAIFAQ }))
);
const EnhanceAIFooter = lazy(() =>
  import('./EnhanceAIFooter').then((m) => ({ default: m.EnhanceAIFooter }))
);

/**
 * Landing page style EnhanceAI — design ultra-premium, mode clair,
 * Glassmorphism, animations Framer Motion.
 */
export const LandingEnhanceAI: React.FC = () => {
  const { t, lang } = useLanguage();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {};
  }, []);

  return (
    <div className="landing-scroll min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#f6f5f2] pb-[calc(var(--inkflow-landing-sticky-cta,4.5rem)+env(safe-area-inset-bottom,0px))] md:pb-0">
      <SEO
        title={t('seo.landing.title')}
        description={t('seo.landing.description')}
        canonical="/"
        keywords={t('seo.landing.keywords')}
        ogImageAlt={
          lang === 'en'
            ? 'InkFlow — tattoo studio management app'
            : 'InkFlow — application de gestion pour tatoueurs'
        }
        schema={faqPageSchemaFr}
      />
      <EnhanceAINavbar />
      <main className="min-h-[60vh] w-full max-w-full overflow-x-hidden bg-[#f6f5f2]">
        <EnhanceAIHero />
        <Suspense fallback={<div className="min-h-[200px]" aria-hidden />}>
          <LandingDemoSection />
          <EnhanceAIFeaturesDetail />
          <EnhanceAIHowInkflow />
          <ProcessSection />
          <PricingSection />
          <TestimonialsSection />
          <EnhanceAIFAQ />
          <EnhanceAIFooter />
        </Suspense>
      </main>
      <LandingMobileStickyCta />
    </div>
  );
};
