/**
 * Flux d'accueil : fondateur → studio → téléphone → photo → SIRET → dispos → Google → notifs → paiements
 */
import React, { useState, useCallback } from 'react';
import { OnboardingFounderStep } from './OnboardingFounderStep';
import { OnboardingStudioStep } from './OnboardingStudioStep';
import { OnboardingPhoneStep } from './OnboardingPhoneStep';
import { OnboardingAvatarStep } from './OnboardingAvatarStep';
import { OnboardingSiretStep } from './OnboardingSiretStep';
import { OnboardingAvailabilityStep } from './OnboardingAvailabilityStep';
import { OnboardingEstablishmentStep } from './OnboardingEstablishmentStep';
import { OnboardingNotificationsStep } from './OnboardingNotificationsStep';
import { OnboardingPaymentsStep } from './OnboardingPaymentsStep';
import {
  setWelcomeDone,
  setFounderNoteDone,
  isFounderNoteDone,
  clearJustSignedUp,
  getWelcomeFlowCheckpoint,
  setWelcomeFlowCheckpoint,
  clearWelcomeFlowCheckpoint,
  clearWelcomeRequired,
} from '../../lib/welcomeStorage';
import { supabase } from '../../lib/supabase';
import { getVitrineDataFromSupabase, saveVitrineDataToSupabase } from '../../lib/supabaseDashboard';
import { defaultVitrineData } from '../../lib/vitrineStorageDefault';
import { useToast } from '../../contexts/ToastContext';
import { AnalyticsEvents, captureEvent } from '../../lib/analytics/capture';

export interface WelcomeOnboardingFlowProps {
  userScopedId: string;
  studioId: string;
  studioSlug: string;
  userEmail: string;
  initialStudioName: string;
  onComplete: (newStudioName?: string) => void;
  /** Après upload avatar onboarding — sync UI header / sidebar. */
  onAvatarUrlUpdated?: (publicUrl: string) => void;
  /** Après enregistrement du nom studio en base (sidebar / header). */
  onStudioNameUpdated?: (studioName: string) => void;
}

type WelcomeStep =
  | 'founder'
  | 'studio'
  | 'phone'
  | 'avatar'
  | 'siret'
  | 'availability'
  | 'establishment'
  | 'notifications'
  | 'payments';

function initialWelcomeStep(userScopedId: string): WelcomeStep {
  const cp = getWelcomeFlowCheckpoint(userScopedId);
  if (cp) return cp;
  return isFounderNoteDone(userScopedId) ? 'studio' : 'founder';
}

export const WelcomeOnboardingFlow: React.FC<WelcomeOnboardingFlowProps> = ({
  userScopedId,
  studioId,
  studioSlug,
  userEmail,
  initialStudioName,
  onComplete,
  onAvatarUrlUpdated,
  onStudioNameUpdated,
}) => {
  const toast = useToast();
  const [step, setStep] = useState<WelcomeStep>(() => initialWelcomeStep(userScopedId));
  const [pendingStudioName, setPendingStudioName] = useState<string | undefined>();
  const [pendingStyles, setPendingStyles] = useState<string[]>([]);
  const [pendingBookingWindowDays, setPendingBookingWindowDays] = useState<number | null>(null);

  const handleStudioComplete = useCallback(
    async (studioName: string, styles: string[]) => {
      try {
        const now = new Date().toISOString();
        const { error: stErr } = await supabase
          .from('inkflow_studios')
          .update({ studio_name: studioName, updated_at: now })
          .eq('id', studioId);
        if (stErr) throw new Error(stErr.message);

        const def = defaultVitrineData(studioSlug);
        const existing = await getVitrineDataFromSupabase(studioId, def);
        const merged = {
          ...existing,
          name: studioName,
          slug: studioSlug,
          ...(styles.length > 0 ? { tattoo_styles: styles } : {}),
        } as typeof existing & { tattoo_styles?: string[] };
        await saveVitrineDataToSupabase(studioId, merged);

        setPendingStudioName(studioName);
        setPendingStyles(styles);
        onStudioNameUpdated?.(studioName);
        setWelcomeFlowCheckpoint(userScopedId, 'phone');
        setStep('phone');
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Enregistrement impossible';
        toast.error(msg);
        throw e;
      }
    },
    [studioId, studioSlug, userScopedId, onStudioNameUpdated, toast]
  );

  const handlePhoneComplete = useCallback(() => {
    setWelcomeFlowCheckpoint(userScopedId, 'avatar');
    setStep('avatar');
  }, [userScopedId]);

  const handleAvatarComplete = useCallback(() => {
    setWelcomeFlowCheckpoint(userScopedId, 'siret');
    setStep('siret');
  }, [userScopedId]);

  const handleSiretComplete = useCallback(() => {
    setWelcomeFlowCheckpoint(userScopedId, 'availability');
    setStep('availability');
  }, [userScopedId]);

  const handleAvailabilityComplete = useCallback(
    async (offDays: number[], bookingWindowDays: number) => {
      try {
        const now = new Date().toISOString();
        const studioName = pendingStudioName ?? initialStudioName;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: upErr } = await (supabase.from('inkflow_studios') as any)
          .update({
            studio_name: studioName,
            availability_settings: { offDays, bookingWindowDays },
            updated_at: now,
          })
          .eq('id', studioId);
        if (upErr) throw new Error(upErr.message);

        const defaultData = defaultVitrineData(studioSlug);
        const existing = await getVitrineDataFromSupabase(studioId, defaultData);
        const mergedAvail = {
          ...existing,
          name: studioName,
          slug: studioSlug,
          tattoo_styles: pendingStyles,
        } as typeof existing & { tattoo_styles?: string[] };
        await saveVitrineDataToSupabase(studioId, mergedAvail);

        setPendingBookingWindowDays(bookingWindowDays);
        setWelcomeFlowCheckpoint(userScopedId, 'establishment');
        setStep('establishment');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Enregistrement impossible');
      }
    },
    [userScopedId, studioId, studioSlug, pendingStudioName, pendingStyles, initialStudioName, toast]
  );

  const handleEstablishmentComplete = useCallback(() => {
    setWelcomeFlowCheckpoint(userScopedId, 'notifications');
    setStep('notifications');
  }, [userScopedId]);

  const handleNotificationsComplete = useCallback(() => {
    setWelcomeFlowCheckpoint(userScopedId, 'payments');
    setStep('payments');
  }, [userScopedId]);

  const finishWelcome = useCallback(() => {
    const studioName = pendingStudioName ?? initialStudioName;
    captureEvent(AnalyticsEvents.ONBOARDING_COMPLETED, {
      selected_style_count: pendingStyles.length,
      ...(pendingBookingWindowDays != null
        ? { booking_window_days: pendingBookingWindowDays }
        : {}),
    });
    setWelcomeDone(userScopedId);
    clearWelcomeFlowCheckpoint(userScopedId);
    clearWelcomeRequired(userScopedId);
    clearJustSignedUp();
    onComplete(studioName);
  }, [
    userScopedId,
    pendingStudioName,
    initialStudioName,
    pendingStyles.length,
    pendingBookingWindowDays,
    onComplete,
  ]);

  if (step === 'founder') {
    return (
      <OnboardingFounderStep
        onNext={() => {
          setFounderNoteDone(userScopedId);
          setWelcomeFlowCheckpoint(userScopedId, 'studio');
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

  if (step === 'phone') {
    return (
      <OnboardingPhoneStep
        studioId={studioId}
        studioSlug={studioSlug}
        userEmail={userEmail}
        onComplete={handlePhoneComplete}
      />
    );
  }

  if (step === 'avatar') {
    return (
      <OnboardingAvatarStep
        studioId={studioId}
        onAvatarSaved={onAvatarUrlUpdated}
        onComplete={handleAvatarComplete}
      />
    );
  }

  if (step === 'siret') {
    return <OnboardingSiretStep studioId={studioId} onComplete={handleSiretComplete} />;
  }

  if (step === 'availability') {
    return <OnboardingAvailabilityStep onComplete={handleAvailabilityComplete} />;
  }

  if (step === 'establishment') {
    return (
      <OnboardingEstablishmentStep
        studioId={studioId}
        studioNameHint={pendingStudioName ?? initialStudioName}
        onComplete={handleEstablishmentComplete}
      />
    );
  }

  if (step === 'notifications') {
    return (
      <OnboardingNotificationsStep studioId={studioId} onComplete={handleNotificationsComplete} />
    );
  }

  return (
    <OnboardingPaymentsStep
      userScopedId={userScopedId}
      studioId={studioId}
      studioSlug={studioSlug}
      onComplete={finishWelcome}
    />
  );
};
