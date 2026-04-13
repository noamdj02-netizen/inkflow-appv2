/**
 * Flux d'accueil : Note du fondateur → Configuration studio
 * Affiché une seule fois aux nouveaux utilisateurs
 */
import React, { useState, useCallback } from 'react';
import { OnboardingFounderStep } from './OnboardingFounderStep';
import { OnboardingStudioStep } from './OnboardingStudioStep';
import { OnboardingAvailabilityStep } from './OnboardingAvailabilityStep';
import {
  isWelcomeDone,
  setWelcomeDone,
  setFounderNoteDone,
  isFounderNoteDone,
  clearJustSignedUp,
} from '../../lib/welcomeStorage';
import { supabase } from '../../lib/supabase';
import { getVitrineDataFromSupabase, saveVitrineDataToSupabase } from '../../lib/supabaseDashboard';
import { defaultVitrineData } from '../../lib/vitrineStorageDefault';

export interface WelcomeOnboardingFlowProps {
  /** Identifiant stable du compte (id Supabase ou email) — clés localStorage */
  userScopedId: string;
  studioId: string;
  studioSlug: string;
  userEmail: string;
  initialStudioName: string;
  onComplete: (newStudioName?: string) => void;
}

export const WelcomeOnboardingFlow: React.FC<WelcomeOnboardingFlowProps> = ({
  userScopedId,
  studioId,
  studioSlug,
  userEmail,
  initialStudioName,
  onComplete,
}) => {
  const [step, setStep] = useState<'founder' | 'studio' | 'availability'>(() =>
    isFounderNoteDone(userScopedId) ? 'studio' : 'founder',
  );
  const [pendingStudioName, setPendingStudioName] = useState<string | undefined>();
  const [pendingStyles, setPendingStyles] = useState<string[]>([]);

  const handleStudioComplete = useCallback(
    async (studioName: string, styles: string[]) => {
      // Stocker temporairement, on sauvegarde tout à la fin
      setPendingStudioName(studioName);
      setPendingStyles(styles);
      setStep('availability');
    },
    []
  );

  const handleAvailabilityComplete = useCallback(
    async (offDays: number[], bookingWindowDays: number) => {
      const now = new Date().toISOString();
      const studioName = pendingStudioName ?? initialStudioName;

      // Mettre à jour le nom du studio + availability_settings
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('inkflow_studios') as any)
        .update({
          studio_name: studioName,
          availability_settings: { offDays, bookingWindowDays },
          updated_at: now,
        })
        .eq('id', studioId);

      // Sauvegarder les styles dans la vitrine (JSONB)
      if (pendingStyles.length > 0) {
        const defaultData = defaultVitrineData(studioSlug);
        const existing = await getVitrineDataFromSupabase(studioId, defaultData);
        const merged = {
          ...existing,
          tattoo_styles: pendingStyles,
        } as typeof existing & { tattoo_styles?: string[] };
        await saveVitrineDataToSupabase(studioId, merged);
      }

      setWelcomeDone(userScopedId);
      clearJustSignedUp();
      onComplete(studioName);
    },
    [userScopedId, studioId, studioSlug, onComplete, pendingStudioName, pendingStyles, initialStudioName]
  );

  if (step === 'founder') {
    return (
      <OnboardingFounderStep
        onNext={() => {
          setFounderNoteDone(userScopedId);
          setStep('studio');
        }}
      />
    );
  }

  if (step === 'studio') {
    return (
      <OnboardingStudioStep
        initialStudioName={initialStudioName}
        onComplete={handleStudioComplete}
      />
    );
  }

  return <OnboardingAvailabilityStep onComplete={handleAvailabilityComplete} />;
};
