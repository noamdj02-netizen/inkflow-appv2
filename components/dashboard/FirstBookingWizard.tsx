import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { computeFirstBookingGoalState, type FirstBookingGoalInput } from '@/lib/firstBookingGoal';
import { markVitrineLinkSharedRemote } from '@/lib/firstBookingActivation';
import { markOpenInboxAfterDemo, setDemoInboxPreviewActive } from '@/lib/demoInboxPreview';
import {
  getFirstBookingWizardStep,
  setFirstBookingWizardDone,
  setFirstBookingWizardStep,
} from '@/lib/firstBookingWizardStorage';
import { useToast } from '@/contexts/ToastContext';

export interface FirstBookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  vitrineUrl: string;
  studioId: string | null | undefined;
  goalInput: FirstBookingGoalInput;
  onGoToVitrineSettings: () => void;
  onGoToAvailability: () => void;
  onGoToFlash: () => void;
  onOpenDemandes: () => void;
  onActivateDemo?: () => void;
}

const WIZARD_STEPS = [
  {
    id: 'intro',
    title: 'Objectif : ta première résa en ligne',
    body: 'En 4 étapes, tu prépares ta vitrine et tu partages ton lien. Dès qu’un client réserve, tu le vois dans Demandes.',
  },
  {
    id: 'vitrine',
    title: 'Ton lien vitrine',
    body: 'C’est le lien à mettre en bio Instagram ou à envoyer en DM. Copie-le maintenant.',
  },
  {
    id: 'availability',
    title: 'Créneaux ouverts',
    body: 'Sans créneaux visibles, les clients abandonnent. Vérifie tes disponibilités.',
  },
  {
    id: 'share',
    title: 'Partage le lien',
    body: 'Story, bio ou message perso — une seule diffusion suffit pour lancer la machine.',
  },
  {
    id: 'flash',
    title: 'Un flash en vitrine (recommandé)',
    body: 'Les flashs convertissent mieux qu’un formulaire vide. Tu peux passer cette étape.',
  },
  {
    id: 'done',
    title: 'C’est en ligne',
    body: 'Quand une demande arrive, traite-la depuis Demandes → À traiter. Le client reçoit un accusé automatique.',
  },
] as const;

export function FirstBookingWizard({
  isOpen,
  onClose,
  vitrineUrl,
  studioId,
  goalInput,
  onGoToVitrineSettings,
  onGoToAvailability,
  onGoToFlash,
  onOpenDemandes,
  onActivateDemo,
}: FirstBookingWizardProps) {
  const toast = useToast();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (isOpen) setStepIndex(getFirstBookingWizardStep());
  }, [isOpen]);

  const goalState = useMemo(() => computeFirstBookingGoalState(goalInput), [goalInput]);

  const persistStep = useCallback((idx: number) => {
    setStepIndex(idx);
    setFirstBookingWizardStep(idx);
  }, []);

  const handleClose = useCallback(() => {
    setFirstBookingWizardStep(stepIndex);
    onClose();
  }, [onClose, stepIndex]);

  const handleFinish = useCallback(() => {
    setFirstBookingWizardDone(true);
    setFirstBookingWizardStep(0);
    onClose();
  }, [onClose]);

  const copyVitrine = useCallback(async () => {
    if (!vitrineUrl) {
      toast.error('Configure d’abord l’URL de ta vitrine.');
      return;
    }
    try {
      await navigator.clipboard.writeText(vitrineUrl);
      if (studioId) void markVitrineLinkSharedRemote(studioId);
      toast.success('Lien vitrine copié !');
    } catch {
      toast.error('Impossible de copier le lien.');
    }
  }, [toast, vitrineUrl, studioId]);

  const step = WIZARD_STEPS[stepIndex];
  const isLast = stepIndex >= WIZARD_STEPS.length - 1;

  const footerPrimary = () => {
    switch (step?.id) {
      case 'vitrine':
        return (
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={copyVitrine}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] dark:bg-white dark:text-zinc-900"
            >
              <Copy className="size-4 shrink-0" aria-hidden />
              Copier mon lien
            </button>
            <button
              type="button"
              onClick={() => {
                onGoToVitrineSettings();
                handleClose();
              }}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-800 transition-all active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200"
            >
              Paramètres vitrine
            </button>
          </div>
        );
      case 'availability':
        return (
          <button
            type="button"
            onClick={() => {
              onGoToAvailability();
              handleClose();
            }}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] dark:bg-white dark:text-zinc-900"
          >
            <Calendar className="size-4 shrink-0" aria-hidden />
            Ouvrir les disponibilités
          </button>
        );
      case 'share':
        return (
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                if (studioId) void markVitrineLinkSharedRemote(studioId);
                toast.success('Parfait — lien marqué comme partagé.');
              }}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] dark:bg-white dark:text-zinc-900"
            >
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              J’ai partagé le lien
            </button>
            {onActivateDemo ? (
              <button
                type="button"
                onClick={() => {
                  setDemoInboxPreviewActive(true);
                  markOpenInboxAfterDemo();
                  onActivateDemo();
                  toast.success('Exemple ajouté dans Demandes — essaie « Confirmer ».');
                  handleClose();
                }}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 px-4 py-2.5 text-sm font-medium text-blue-800 transition-all active:scale-[0.98] dark:border-blue-500/40 dark:text-blue-200"
              >
                Voir un exemple dans Demandes
              </button>
            ) : null}
            {vitrineUrl ? (
              <a
                href={vitrineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-800 transition-all active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200"
              >
                <ExternalLink className="size-4 shrink-0" aria-hidden />
                Voir ma vitrine
              </a>
            ) : null}
          </div>
        );
      case 'flash':
        return (
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                onGoToFlash();
                handleClose();
              }}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] dark:bg-white dark:text-zinc-900"
            >
              <Zap className="size-4 shrink-0" aria-hidden />
              Ajouter un flash
            </button>
            <button
              type="button"
              onClick={() => persistStep(stepIndex + 1)}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-all active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-400"
            >
              Passer
            </button>
          </div>
        );
      case 'done':
        return (
          <button
            type="button"
            onClick={() => {
              handleFinish();
              if (goalState.isGoalReached) onOpenDemandes();
            }}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700 active:scale-[0.98]"
          >
            {goalState.isGoalReached ? 'Voir mes demandes' : 'Fermer le guide'}
          </button>
        );
      default:
        return (
          <button
            type="button"
            onClick={() => persistStep(stepIndex + 1)}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] dark:bg-white dark:text-zinc-900"
          >
            Commencer
            <ChevronRight className="size-4 shrink-0" aria-hidden />
          </button>
        );
    }
  };

  if (!step) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Première réservation" size="md">
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <span>
            Étape {stepIndex + 1} / {WIZARD_STEPS.length}
          </span>
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
            role="progressbar"
            aria-valuenow={stepIndex + 1}
            aria-valuemin={1}
            aria-valuemax={WIZARD_STEPS.length}
          >
            <div
              className="h-full rounded-full bg-blue-500 transition-[width] duration-300"
              style={{ width: `${((stepIndex + 1) / WIZARD_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Sparkles className="size-5" strokeWidth={2} aria-hidden />
          </div>
          <h3 className="type-heading-sm">{step.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {step.body}
          </p>
          {step.id === 'vitrine' && vitrineUrl ? (
            <p className="mt-3 break-all rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
              {vitrineUrl}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => persistStep(Math.max(0, stepIndex - 1))}
            className={cn(
              'inline-flex min-h-11 items-center justify-center gap-1 rounded-xl px-3 text-sm font-medium text-zinc-600 transition-all active:scale-[0.98] disabled:opacity-40 dark:text-zinc-400',
              stepIndex === 0 && 'pointer-events-none'
            )}
          >
            <ChevronLeft className="size-4 shrink-0" aria-hidden />
            Retour
          </button>
          <div className="min-w-0 flex-1">{footerPrimary()}</div>
          {!isLast &&
          step.id !== 'flash' &&
          step.id !== 'vitrine' &&
          step.id !== 'availability' &&
          step.id !== 'share' ? (
            <button
              type="button"
              onClick={() => persistStep(stepIndex + 1)}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-xl px-3 text-sm font-medium text-zinc-600 dark:text-zinc-400"
            >
              Suivant
              <ChevronRight className="size-4 shrink-0" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
