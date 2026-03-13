import React, { useEffect, lazy, Suspense } from 'react';
import { EnhanceAINavbar } from './EnhanceAINavbar';
import { EnhanceAIHero } from './EnhanceAIHero';
import { SEO, organizationSchema, websiteSchema } from '../SEO';

const EnhanceAIFeaturesDetail = lazy(() => import('./EnhanceAIFeaturesDetail').then(m => ({ default: m.EnhanceAIFeaturesDetail })));
const EnhanceAIHowInkflow = lazy(() => import('./EnhanceAIHowInkflow').then(m => ({ default: m.EnhanceAIHowInkflow })));
const ProcessSection = lazy(() => import('../ProcessSection').then(m => ({ default: m.ProcessSection })));
const PricingSection = lazy(() => import('../PricingSection').then(m => ({ default: m.PricingSection })));
const TestimonialsSection = lazy(() => import('./TestimonialsSection').then(m => ({ default: m.TestimonialsSection })));
const EnhanceAIFAQ = lazy(() => import('./EnhanceAIFAQ').then(m => ({ default: m.EnhanceAIFAQ })));
const EnhanceAIFooter = lazy(() => import('./EnhanceAIFooter').then(m => ({ default: m.EnhanceAIFooter })));

/**
 * Landing page style EnhanceAI — design ultra-premium, mode clair,
 * Glassmorphism, animations Framer Motion.
 */
export const LandingEnhanceAI: React.FC = () => {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {};
  }, []);

  return (
  <div className="landing-scroll min-h-screen min-h-[100dvh] bg-white w-full max-w-full overflow-x-hidden">
    <SEO
      title="InkFlow | Le logiciel de gestion et réservation pour Tatoueurs"
      description="Révolutionnez votre studio de tatouage. Réservations, paiements Stripe, CRM et assistant IA. Gagnez du temps avec InkFlow."
      canonical="/"
      schema={[organizationSchema, websiteSchema]}
    />
    <EnhanceAINavbar />
    <main className="bg-white min-h-[60vh] w-full max-w-full overflow-x-hidden">
      <EnhanceAIHero />
      <Suspense fallback={<div className="min-h-[200px]" aria-hidden />}>
        <EnhanceAIFeaturesDetail />
        <EnhanceAIHowInkflow />
        <ProcessSection />
        <PricingSection />
        <TestimonialsSection />
        <EnhanceAIFAQ />
        <EnhanceAIFooter />
      </Suspense>
    </main>
  </div>
  );
};
