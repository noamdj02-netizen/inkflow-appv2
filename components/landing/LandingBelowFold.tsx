import React from 'react';
import { SocialProof } from '../SocialProof';
import { FeaturesKey } from '../FeaturesKey';
import { FeaturesBento } from '../FeaturesBento';
import { PricingSection } from '../PricingSection';
import { ProcessSection } from '../ProcessSection';
import { FAQ } from '../FAQ';
import { CTAFinal } from '../CTAFinal';
import { Footer } from '../Footer';

/** Composant lazy-loaded : tout le contenu sous la ligne de flottaison (Hero). */
export const LandingBelowFold: React.FC = () => (
  <>
    <FeaturesKey />
    <FeaturesBento />
    <SocialProof />
    <PricingSection />
    <ProcessSection />
    <FAQ />
    <CTAFinal />
    <Footer />
  </>
);
