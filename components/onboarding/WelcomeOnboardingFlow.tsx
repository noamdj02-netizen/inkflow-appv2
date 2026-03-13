/**
 * Flux d'accueil : Note du fondateur → Configuration studio
 * Affiché une seule fois aux nouveaux utilisateurs
 */
import React, { useState, useCallback } from 'react';
import { OnboardingFounderStep } from './OnboardingFounderStep';
import { OnboardingStudioStep } from './OnboardingStudioStep';
import { isWelcomeDone, setWelcomeDone } from '../../lib/welcomeStorage';
import { supabase } from '../../lib/supabase';
import { getVitrineDataFromSupabase, saveVitrineDataToSupabase } from '../../lib/supabaseDashboard';
import { defaultVitrineData } from '../../lib/vitrineStorageDefault';

export interface WelcomeOnboardingFlowProps {
  studioId: string;
  studioSlug: string;
  userEmail: string;
  initialStudioName: string;
  onComplete: (newStudioName?: string) => void;
}

export const WelcomeOnboardingFlow: React.FC<WelcomeOnboardingFlowProps> = ({
  studioId,
  studioSlug,
  userEmail,
  initialStudioName,
  onComplete,
}) => {
  const [step, setStep] = useState<'founder' | 'studio'>('founder');

  const handleStudioComplete = useCallback(
    async (studioName: string, styles: string[]) => {
      const now = new Date().toISOString();

      // Mettre à jour le nom du studio
      await supabase
        .from('inkflow_studios')
        .update({ studio_name: studioName, updated_at: now })
        .eq('id', studioId);

      // Sauvegarder les styles dans la vitrine (JSONB)
      const defaultData = defaultVitrineData(studioSlug);
      const existing = await getVitrineDataFromSupabase(studioId, defaultData);
      const merged = {
        ...existing,
        ...(styles.length > 0 && { tattoo_styles: styles }),
      } as typeof existing & { tattoo_styles?: string[] };
      await saveVitrineDataToSupabase(studioId, merged);

      setWelcomeDone();
      onComplete(studioName);
    },
    [studioId, studioSlug, onComplete]
  );

  if (step === 'founder') {
    return <OnboardingFounderStep onNext={() => setStep('studio')} />;
  }

  return (
    <OnboardingStudioStep
      initialStudioName={initialStudioName}
      onComplete={handleStudioComplete}
    />
  );
};

export function shouldShowWelcomeFlow(): boolean {
  return !isWelcomeDone();
}
