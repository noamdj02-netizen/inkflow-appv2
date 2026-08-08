import { Zap } from 'lucide-react';
import type { InboxQuickTarget } from '@/lib/inboxQuickAction';
import { inboxPrimaryActionLabel, inboxSourceChipLabel } from '@/lib/inboxQuickAction';
import {
  dashboardInboxSectionTitle,
  dashboardPrimaryBtn,
  dashboardTreatNextBar,
} from './ui/dashboardPilotagePage';

export interface InboxTreatNextBarProps {
  totalPending: number;
  target: InboxQuickTarget;
  onPrimary: () => void;
}

/** Bandeau « action immédiate » — palette pilotage (zinc / emerald). */
export function InboxTreatNextBar({ totalPending, target, onPrimary }: InboxTreatNextBarProps) {
  if (totalPending <= 0) return null;

  return (
    <div className={dashboardTreatNextBar}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className={dashboardInboxSectionTitle}>Action immédiate</p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">{target.clientName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {inboxSourceChipLabel(target)} · {totalPending} en attente
          </p>
        </div>
        <button
          type="button"
          onClick={onPrimary}
          className={`${dashboardPrimaryBtn} w-full sm:w-auto sm:min-w-[12rem]`}
        >
          <Zap className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          {inboxPrimaryActionLabel(target)}
        </button>
      </div>
    </div>
  );
}
