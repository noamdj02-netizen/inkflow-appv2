import React, { useMemo } from 'react';
import { CalendarDays, ExternalLink } from 'lucide-react';
import { getDeclarationDeadlineHints, type DeclarationFrequency } from '../../../lib/fiscal';

interface FiscalDeclarationCalendarProps {
  frequency: DeclarationFrequency;
}

/** Timeline indicative — les dates officielles sont sur ton espace URSSAF / tes courriers. */
export const FiscalDeclarationCalendar: React.FC<FiscalDeclarationCalendarProps> = ({
  frequency,
}) => {
  const hints = useMemo(() => getDeclarationDeadlineHints(frequency, 3, new Date()), [frequency]);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 border-l-4 border-l-zinc-200 500">
      <div className="flex items-start gap-2 mb-3">
        <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white">
            Prochains rappels indicatifs URSSAF
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Fréquence choisie : {frequency === 'monthly' ? 'mensuelle' : 'trimestrielle'} — dates à{' '}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">confirmer</span> sur ton
            compte ou courrier officiel (InkFlow n’inferre pas tes échéances réelles).
          </p>
        </div>
      </div>
      <ol className="space-y-3 list-decimal list-inside marker:text-zinc-400">
        {hints.map((h) => (
          <li
            key={h.isoDate + h.label}
            className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 px-3 py-2.5"
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-white">{h.label}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{h.detail}</p>
            <p className="text-xs tabular-nums text-zinc-600 dark:text-zinc-400 mt-1">
              Date affichée : {new Date(h.isoDate + 'T12:00:00').toLocaleDateString('fr-FR')}
            </p>
          </li>
        ))}
      </ol>
      <a
        href="https://www.autoentrepreneur.urssaf.fr/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-blue-700 dark:text-blue-300 hover:underline active:scale-[0.98] transition-all"
      >
        Ouvrir le portail auto-entrepreneur
        <ExternalLink className="w-4 h-4 shrink-0" />
      </a>
      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
        Rappels push J-7 / J-1 : activer les notifications du navigateur ou un agenda externe.
      </p>
    </div>
  );
};
