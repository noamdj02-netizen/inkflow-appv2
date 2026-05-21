import React, { useEffect, lazy, Suspense } from 'react';
import { EnhanceAINavbar } from './EnhanceAINavbar';
import { EnhanceAIHero } from './EnhanceAIHero';
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
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {};
  }, []);

  return (
    <div className="landing-scroll min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#f6f5f2]">
      <SEO
        title="InkFlow | Logiciel tatoueur France — agenda et réservations en ligne"
        description="Logiciel de gestion pour tatoueurs en France : agenda, réservations en ligne, acomptes Stripe (EUR), CRM et vitrine. Moins d'allers-retours sur Insta, plus de temps pour tatouer. Essai gratuit 1 mois sans carte."
        canonical="/"
        keywords="logiciel tatoueur France, agenda tatouage, réservation tatouage en ligne, SaaS tatouage, CRM studio tattoo, gestion salon tatouage, acompte Stripe tatoueur, vitrine tatoueur, application tatoueur professionnel"
        ogImageAlt="InkFlow — application de gestion pour tatoueurs"
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
    </div>
  );
};
