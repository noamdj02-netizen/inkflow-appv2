import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, ChevronRight, PartyPopper, Route, X } from 'lucide-react';
import {
  computeFirstBookingGoalState,
  FIRST_BOOKING_STEPS,
  type FirstBookingGoalInput,
} from '@/lib/firstBookingGoal';
import { getFirstBookingWizardDone } from '@/lib/firstBookingWizardStorage';
import { fetchVitrineLinkSharedRemote } from '@/lib/firstBookingActivation';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'inkflow-dismiss-first-booking-goal';

export interface FirstBookingGoalCardProps extends FirstBookingGoalInput {
  studioId?: string | null;
  pendingDemandesCount: number;
  onOpenWizard: () => void;
  onOpenDemandes: () => void;
  onActivateDemo?: () => void;
  onGoTo: (
    target:
      | 'settings-vitrine'
      | 'settings-availability'
      | 'settings-payments'
      | 'flash'
      | 'appointments'
  ) => void;
}

export function FirstBookingGoalCard({
  studioId,
  pendingDemandesCount,
  onOpenWizard,
  onOpenDemandes,
  onActivateDemo,
  onGoTo,
  ...goalInput
}: FirstBookingGoalCardProps) {
  const [vitrineSharedRemote, setVitrineSharedRemote] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (!studioId?.trim()) return;
    let cancelled = false;
    void fetchVitrineLinkSharedRemote(studioId).then((v) => {
      if (!cancelled) setVitrineSharedRemote(v);
    });
    return () => {
      cancelled = true;
    };
  }, [studioId]);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  const state = useMemo(
    () =>
      computeFirstBookingGoalState({
        ...goalInput,
        vitrineLinkShared: vitrineSharedRemote,
      }),
    [goalInput, vitrineSharedRemote]
  );
  const wizardDone = getFirstBookingWizardDone();

  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      //
    }
    setDismissed(true);
  }, []);

  if (dismissed && !state.isGoalReached) {
    return null;
  }

  if (state.isGoalReached) {
    return (
      <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/95 to-white p-4 dark:border-emerald-500/30 dark:from-emerald-950/35 dark:to-zinc-900/80 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <PartyPopper className="size-5" strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm sm:text-base">
              Première réservation reçue
            </h3>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Bravo — traite les demandes depuis Demandes pour confirmer et encaisser l’acompte.
            </p>
            {pendingDemandesCount > 0 ? (
              <button
                type="button"
                onClick={onOpenDemandes}
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 active:scale-[0.98]"
              >
                {pendingDemandesCount} à traiter
                <ChevronRight className="size-4 shrink-0" aria-hidden />
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="shrink-0 rounded-xl p-2 text-zinc-400 transition-colors hover:bg-white/60 hover:text-zinc-600 dark:hover:bg-zinc-800/50"
            aria-label="Masquer"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  const stepAction = (id: (typeof FIRST_BOOKING_STEPS)[number]['id']) => {
    switch (id) {
      case 'vitrine':
        return () => onGoTo('settings-vitrine');
      case 'availability':
        return () => onGoTo('settings-availability');
      case 'share':
        return onOpenWizard;
      case 'flash':
        return () => onGoTo('flash');
      case 'first_booking':
        return onOpenDemandes;
      default:
        return onOpenWizard;
    }
  };

  return (
    <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-white p-4 dark:border-blue-500/25 dark:from-blue-950/30 dark:to-zinc-900/80 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-zinc-700/60 bg-zinc-800 text-zinc-300">
            <Route className="size-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm sm:text-base">
              Objectif : première résa en ligne — {state.percent}%
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Vitrine → créneaux → partage → (flash) → première demande.
            </p>
            <div
              className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800"
              role="progressbar"
              aria-valuenow={state.percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-blue-500 transition-[width] duration-500"
                style={{ width: `${state.percent}%` }}
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded-xl p-2 text-zinc-400 transition-colors hover:bg-white/60 hover:text-zinc-600 dark:hover:bg-zinc-800/50"
          aria-label="Masquer l’objectif"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <ul className="mb-3 space-y-1.5">
        {FIRST_BOOKING_STEPS.map((s) => {
          const done = state.steps[s.id];
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={stepAction(s.id)}
                disabled={done && s.id !== 'share'}
                className={cn(
                  'flex min-h-[44px] w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.99]',
                  done
                    ? 'border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-500/25 dark:bg-emerald-950/20'
                    : 'border-zinc-200/60 bg-white/70 hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-blue-500/50'
                )}
              >
                {done ? (
                  <CheckCircle2
                    className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden
                  />
                ) : (
                  <Circle
                    className="size-5 shrink-0 text-blue-500 dark:text-blue-400/80"
                    aria-hidden
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {s.label}
                  </span>
                  {!done ? (
                    <span className="block text-[11px] text-zinc-500 dark:text-zinc-500">
                      {s.hint}
                    </span>
                  ) : null}
                </span>
                {!done ? (
                  <ChevronRight className="size-4 shrink-0 text-zinc-400" aria-hidden />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onOpenWizard}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] dark:bg-white dark:text-zinc-900"
        >
          {wizardDone ? 'Reprendre le guide' : 'Guide pas à pas (5 min)'}
          <ChevronRight className="size-4 shrink-0" aria-hidden />
        </button>
        {onActivateDemo && !state.steps.first_booking ? (
          <button
            type="button"
            onClick={onActivateDemo}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300/90 px-4 py-2.5 text-sm font-medium text-blue-800 transition-all active:scale-[0.98] dark:border-blue-500/35 dark:text-blue-200"
          >
            Voir un exemple dans Demandes
          </button>
        ) : null}
      </div>
    </div>
  );
}
