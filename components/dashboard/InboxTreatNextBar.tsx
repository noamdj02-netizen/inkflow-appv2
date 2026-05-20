import { Zap } from 'lucide-react';
import type { InboxQuickTarget } from '@/lib/inboxQuickAction';
import { inboxPrimaryActionLabel, inboxSourceChipLabel } from '@/lib/inboxQuickAction';

export interface InboxTreatNextBarProps {
  totalPending: number;
  target: InboxQuickTarget;
  onPrimary: () => void;
}

/** Bandeau « action immédiate » — une décision, un tap. */
export function InboxTreatNextBar({ totalPending, target, onPrimary }: InboxTreatNextBarProps) {
  if (totalPending <= 0) return null;

  return (
    <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-r from-blue-50/95 to-white p-3.5 dark:border-blue-500/30 dark:from-blue-950/40 dark:to-zinc-900/60 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400">
            Action immédiate
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-zinc-900 dark:text-white">
            {target.clientName}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {inboxSourceChipLabel(target)} · {totalPending} en attente
          </p>
        </div>
        <button
          type="button"
          onClick={onPrimary}
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] sm:w-auto sm:min-w-[12rem]"
        >
          <Zap className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          {inboxPrimaryActionLabel(target)}
        </button>
      </div>
    </div>
  );
}
