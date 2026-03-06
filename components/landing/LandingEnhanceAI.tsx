import React, { useEffect } from 'react';
import { EnhanceAINavbar } from './EnhanceAINavbar';
import { EnhanceAIHero } from './EnhanceAIHero';
import { EnhanceAISocialProof } from './EnhanceAISocialProof';
import { EnhanceAIFeaturesDetail } from './EnhanceAIFeaturesDetail';
import { EnhanceAIHowInkflow } from './EnhanceAIHowInkflow';
import { ProcessSection } from '../ProcessSection';
import { EnhanceAITestimonials } from './EnhanceAITestimonials';
import { EnhanceAIFAQ } from './EnhanceAIFAQ';
import { EnhanceAIFooter } from './EnhanceAIFooter';
import { PricingSection } from '../PricingSection';
import { SEO, organizationSchema, websiteSchema } from '../SEO';

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
    <main>
      <EnhanceAIHero />
      <EnhanceAISocialProof />
      <EnhanceAIFeaturesDetail />
      <EnhanceAIHowInkflow />
      <ProcessSection />
      <PricingSection />
      <EnhanceAITestimonials />
      <EnhanceAIFAQ />
      <EnhanceAIFooter />
    </main>
  </div>
  );
};
