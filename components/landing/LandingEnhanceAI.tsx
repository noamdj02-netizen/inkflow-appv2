import React, { useEffect, lazy, Suspense } from 'react';
import { EnhanceAINavbar } from './EnhanceAINavbar';
import { EnhanceAIHero } from './EnhanceAIHero';
import { AddToHomeScreenBanner } from './AddToHomeScreenBanner';
import { SEO, organizationSchema, websiteSchema } from '../SEO';

const EnhanceAISocialProof = lazy(() => import('./EnhanceAISocialProof').then(m => ({ default: m.EnhanceAISocialProof })));
const EnhanceAIFeaturesDetail = lazy(() => import('./EnhanceAIFeaturesDetail').then(m => ({ default: m.EnhanceAIFeaturesDetail })));
const EnhanceAIHowInkflow = lazy(() => import('./EnhanceAIHowInkflow').then(m => ({ default: m.EnhanceAIHowInkflow })));
const ProcessSection = lazy(() => import('../ProcessSection').then(m => ({ default: m.ProcessSection })));
const PricingSection = lazy(() => import('../PricingSection').then(m => ({ default: m.PricingSection })));
const EnhanceAITestimonials = lazy(() => import('./EnhanceAITestimonials').then(m => ({ default: m.EnhanceAITestimonials })));
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
  <div className="landing-scroll min-h-screen bg-white">
    <SEO
      title="InkFlow | Le logiciel de gestion et réservation pour Tatoueurs"
      description="Révolutionnez votre studio de tatouage. Réservations, paiements Stripe, CRM et assistant IA. Gagnez du temps avec InkFlow."
      canonical="/"
      schema={[organizationSchema, websiteSchema]}
    />
    <EnhanceAINavbar />
    <AddToHomeScreenBanner />
    <main>
      <EnhanceAIHero />
      <Suspense fallback={<div className="min-h-[200px]" aria-hidden />}>
        <EnhanceAISocialProof />
        <EnhanceAIFeaturesDetail />
        <EnhanceAIHowInkflow />
        <ProcessSection />
        <PricingSection />
        <EnhanceAITestimonials />
        <EnhanceAIFAQ />
        <EnhanceAIFooter />
      </Suspense>
    </main>
  </div>
  );
};
