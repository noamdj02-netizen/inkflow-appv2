import React, { useState, useEffect, useCallback } from 'react';
import { X, Check, ChevronRight } from 'lucide-react';
import {
  getOnboardingFromLocal,
  setOnboardingToLocal,
  getOnboardingFromSupabase,
  setOnboardingToSupabase,
  type OnboardingState,
} from '../lib/onboardingStorage';

export type OnboardingStepId = 'account' | 'avatar' | 'flash' | 'bookings';

const STEPS: { id: OnboardingStepId; label: string }[] = [
  { id: 'account', label: 'Compte créé' },
  { id: 'avatar', label: 'Photo de profil' },
  { id: 'flash', label: '3 Flash ajoutés' },
  { id: 'bookings', label: 'Réservations activées' },
];

export interface OnboardingBannerProps {
  studioId: string | null;
  useSupabase: boolean;
  /** Étape 1 toujours true. */
  hasAvatar: boolean;
  flashCount: number;
  bookingsEnabled: boolean;
  onContinue: (targetStep: OnboardingStepId) => void;
}

function getCompletedSteps(hasAvatar: boolean, flashCount: number, bookingsEnabled: boolean): number {
  let n = 1; // Compte créé
  if (hasAvatar) n++;
  if (flashCount >= 3) n++;
  if (bookingsEnabled) n++;
  return n;
}

export const OnboardingBanner: React.FC<OnboardingBannerProps> = ({
  studioId,
  useSupabase,
  hasAvatar,
  flashCount,
  bookingsEnabled,
  onContinue,
}) => {
  const [state, setState] = useState<OnboardingState>(() => getOnboardingFromLocal());
  const [loaded, setLoaded] = useState(!useSupabase || !studioId);

  const completed = getCompletedSteps(hasAvatar, flashCount, bookingsEnabled);
  const allDone = completed >= 4;

  useEffect(() => {
    if (!studioId || !useSupabase) {
      setLoaded(true);
      return;
    }
    getOnboardingFromSupabase(studioId).then((remote) => {
      if (remote) setState(remote);
      setLoaded(true);
    });
  }, [studioId, useSupabase]);

  const persist = useCallback(
    (next: OnboardingState) => {
      setState(next);
      setOnboardingToLocal(next);
      if (studioId && useSupabase) setOnboardingToSupabase(studioId, next);
    },
    [studioId, useSupabase]
  );

  const handleDismiss = () => persist({ ...state, dismissed: true });
  const handleContinue = () => {
    if (completed >= 4) return;
    const nextStep = STEPS[completed];
    if (nextStep) onContinue(nextStep.id);
  };

  if (!loaded || allDone || state.dismissed) return null;

  const stepChecks = [
    true,
    hasAvatar,
    flashCount >= 3,
    bookingsEnabled,
  ];

  return (
    <div
      className="mb-6 rounded-2xl border p-4 sm:p-5"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Guide de démarrage
            </span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {completed}/4 complété
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden mb-4"
            style={{ backgroundColor: 'var(--border)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(completed / 4) * 100}%`,
                backgroundColor: 'var(--orange)',
              }}
            />
          </div>
          <ul className="space-y-1.5 mb-4">
            {STEPS.map((step, i) => {
              const done = stepChecks[i];
              return (
                <li key={step.id} className="flex items-center gap-2 text-sm">
                  {done ? (
                    <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--green)' }} />
                  ) : (
                    <span className="w-4 h-4 shrink-0 rounded-full border-2" style={{ borderColor: 'var(--border)' }} />
                  )}
                  <span style={{ color: done ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={handleContinue}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-white text-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--orange)' }}
          >
            Continuer
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-2 rounded-lg shrink-0 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
