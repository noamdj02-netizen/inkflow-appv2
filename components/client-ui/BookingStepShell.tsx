/**
 * Enveloppe d’étape pour tunnel réservation (/book) — une question à la fois, progression lisible.
 * Pas de <form> HTML : zone interactive contrôlée par boutons / handlers parent.
 */
import React from 'react';
import { ChevronLeft } from 'lucide-react';

export interface BookingStepShellProps {
  /** 1-based */
  step: number;
  totalSteps: number;
  title: string;
  description?: string;
  onBack?: () => void;
  backLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const BookingStepShell: React.FC<BookingStepShellProps> = ({
  step,
  totalSteps,
  title,
  description,
  onBack,
  backLabel = 'Retour',
  children,
  footer,
  className = '',
}) => {
  const pct = totalSteps > 0 ? Math.min(100, Math.round((step / totalSteps) * 100)) : 0;

  return (
    <div className={`font-sans text-zinc-100 max-w-lg mx-auto w-full px-4 py-6 safe-top ${className}`}>
      <div className="mb-6 flex items-center gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/80 text-zinc-100 transition-all active:scale-[0.98]"
            aria-label={backLabel}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
        ) : (
          <span className="w-11" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Étape {step} / {totalSteps}
          </p>
          <div
            className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-zinc-800"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-amber-600/90 transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <h1 className="text-xl font-bold tracking-tight text-zinc-100 mb-2">{title}</h1>
      {description ? <p className="text-sm text-zinc-400 leading-relaxed mb-6">{description}</p> : <div className="mb-4" />}

      <div className="space-y-4">{children}</div>

      {footer ? <div className="mt-8 space-y-3">{footer}</div> : null}
    </div>
  );
};
