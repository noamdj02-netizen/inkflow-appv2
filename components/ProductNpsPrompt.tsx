import React, { useEffect, useState, useCallback } from 'react';
import { X, MessageCircleHeart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useInkflowPathname } from '../hooks/useInkflowPathname';
import { isPosthogInitialized } from '../lib/analytics/posthogInit';
import { AnalyticsEvents, captureEvent } from '../lib/analytics/capture';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function npsKey(userId: string) {
  return `inkflow_nps_last_shown_v1_${userId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80)}`;
}

const SCORE_ROW1 = [0, 1, 2, 3, 4, 5] as const;
const SCORE_ROW2 = [6, 7, 8, 9, 10] as const;

/**
 * NPS in-app (une question, score 0–10) — réaffiche au plus toutes les 30 jours par compte.
 * Envoi PostHog si clé + consentement actifs.
 */
export const ProductNpsPrompt: React.FC = () => {
  const { user, isAuthenticated, authLoading } = useAuth();
  const path = useInkflowPathname();
  const [open, setOpen] = useState(false);

  const tryOpen = useCallback(() => {
    if (authLoading || !isAuthenticated || !user) return;
    if (path !== '/dashboard') return;
    try {
      if (sessionStorage.getItem('inkflow_nps_shown_session') === '1') return;
    } catch {
      /* ignore */
    }
    let last = 0;
    try {
      const raw = localStorage.getItem(npsKey(user.id));
      if (raw) last = parseInt(raw, 10) || 0;
    } catch {
      return;
    }
    if (last && Date.now() - last < THIRTY_DAYS_MS) return;
    try {
      sessionStorage.setItem('inkflow_nps_shown_session', '1');
    } catch {
      /* ignore */
    }
    setOpen(true);
  }, [authLoading, isAuthenticated, user, path]);

  useEffect(() => {
    const t = window.setTimeout(tryOpen, 4000);
    return () => window.clearTimeout(t);
  }, [tryOpen]);

  const dismiss = () => {
    setOpen(false);
    if (user) {
      try {
        localStorage.setItem(npsKey(user.id), String(Date.now()));
      } catch {
        /* ignore */
      }
    }
    if (isPosthogInitialized()) {
      captureEvent(AnalyticsEvents.NPS_DISMISSED, { funnel: 'nps' });
    }
  };

  const onScore = (score: number) => {
    setOpen(false);
    if (user) {
      try {
        localStorage.setItem(npsKey(user.id), String(Date.now()));
      } catch {
        /* ignore */
      }
    }
    if (isPosthogInitialized()) {
      captureEvent(AnalyticsEvents.NPS_SCORE, { score, funnel: 'nps', nps_type: '0_10' });
    }
  };

  if (!open || !user) return null;

  return (
    <div
      className="fixed left-0 right-0 z-[9998] p-3 pb-safe pointer-events-auto sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-md sm:p-4
        max-sm:bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))]"
      role="dialog"
      aria-labelledby="nps-prompt-title"
    >
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-2 border-b border-neutral-100 p-3 dark:border-zinc-800 sm:p-4">
          <div className="flex min-w-0 items-center gap-2">
            <MessageCircleHeart className="h-5 w-5 shrink-0 text-rose-500" aria-hidden />
            <h2
              id="nps-prompt-title"
              className="text-sm font-semibold leading-snug text-neutral-900 dark:text-zinc-100"
            >
              Recommanderiez-vous InkFlow à un confrère ?
            </h2>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="px-3 pt-2 text-xs text-neutral-500 dark:text-zinc-400 sm:px-4">
          0 = pas du tout · 10 = tout à fait
        </p>
        {/* Mobile : 2 rangées (6+5) pour cibles ≥44px — desktop : une rangée */}
        <div className="p-3 sm:hidden">
          <div className="space-y-1.5">
            <div className="grid grid-cols-6 gap-1.5">
              {SCORE_ROW1.map((i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => onScore(i)}
                  className="min-h-11 min-w-0 rounded-xl bg-neutral-100 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-900 hover:text-white active:scale-[0.98] dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="mx-auto grid max-w-[12rem] grid-cols-5 gap-1.5">
              {SCORE_ROW2.map((i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => onScore(i)}
                  className="min-h-11 min-w-0 rounded-xl bg-neutral-100 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-900 hover:text-white active:scale-[0.98] dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="hidden flex-wrap justify-center gap-1.5 p-3 sm:flex sm:p-3.5">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => onScore(i)}
              className="h-10 min-w-10 rounded-xl bg-neutral-100 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-900 hover:text-white dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              {i}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
