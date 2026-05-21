import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronRight, Pin, Star } from 'lucide-react';
import {
  QUICK_ACCESS_CATALOG,
  QUICK_ACCESS_MAX_PINS,
  type QuickAccessInsight,
  type QuickAccessItemId,
} from '../../lib/dashboardQuickAccess';
import { useToast } from '../../contexts/ToastContext';

const INSIGHT_STYLES: Record<
  QuickAccessInsight['variant'],
  { border: string; dot: string; bg: string }
> = {
  alert: {
    border: 'border-l-amber-500 dark:border-l-amber-400',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50/90 dark:bg-amber-950/25 border-amber-200/70 dark:border-amber-900/40',
  },
  today: {
    border: 'border-l-blue-600 dark:border-l-blue-500',
    dot: 'bg-blue-600 dark:bg-blue-500',
    bg: 'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40',
  },
  calm: {
    border: 'border-l-zinc-900 dark:border-l-zinc-100',
    dot: 'bg-zinc-900 dark:bg-zinc-100',
    bg: 'bg-white dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800',
  },
};

export interface DashboardSidebarQuickAccessProps {
  pins: QuickAccessItemId[];
  recents: QuickAccessItemId[];
  insight: QuickAccessInsight;
  activeQuickId: QuickAccessItemId | null;
  onNavigate: (id: QuickAccessItemId) => void;
  onTogglePin: (id: QuickAccessItemId) => { atMax: boolean };
  getBadge?: (id: QuickAccessItemId) => number | undefined;
}

export function DashboardSidebarQuickAccess({
  pins,
  recents,
  insight,
  activeQuickId,
  onNavigate,
  onTogglePin,
  getBadge,
}: DashboardSidebarQuickAccessProps) {
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const [listTab, setListTab] = useState<'pins' | 'recent'>('pins');

  const catalogMap = useMemo(() => new Map(QUICK_ACCESS_CATALOG.map((c) => [c.id, c])), []);

  const listIds = listTab === 'pins' ? pins : recents;
  const style = INSIGHT_STYLES[insight.variant];

  const handlePinClick = (e: React.MouseEvent, id: QuickAccessItemId) => {
    e.stopPropagation();
    const { atMax } = onTogglePin(id);
    if (atMax) {
      toast.error(`Maximum ${QUICK_ACCESS_MAX_PINS} raccourcis épinglés.`);
    }
  };

  return (
    <div className="relative z-10 px-4 pt-3 pb-2">
      <AnimatePresence mode="wait" initial={false}>
        <motion.button
          key={insight.id}
          type="button"
          onClick={() => onNavigate(insight.targetId)}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={`mb-2.5 w-full rounded-2xl border border-l-4 p-3 text-left shadow-sm transition-all active:scale-[0.98] motion-reduce:active:scale-100 ${style.border} ${style.bg}`}
        >
          <div className="flex items-start gap-2.5">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.dot}`} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                {insight.eyebrow}
              </p>
              <p className="mt-0.5 text-sm font-semibold leading-snug text-zinc-900 dark:text-white">
                {insight.title}
              </p>
              <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {insight.cta}
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
            {insight.badge != null && insight.badge > 0 && (
              <span className="shrink-0 rounded-lg bg-zinc-900 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white dark:bg-white dark:text-zinc-900">
                {insight.badge > 99 ? '99+' : insight.badge}
              </span>
            )}
          </div>
        </motion.button>
      </AnimatePresence>

      <div
        className="flex rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 p-1 gap-0.5 mb-1.5"
        role="tablist"
        aria-label="Raccourcis personnalisés"
      >
        <button
          type="button"
          role="tab"
          aria-selected={listTab === 'pins'}
          onClick={() => setListTab('pins')}
          className={`flex-1 min-h-[36px] rounded-xl text-[11px] font-semibold transition-all active:scale-[0.98] motion-reduce:active:scale-100 inline-flex items-center justify-center gap-1 ${
            listTab === 'pins'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Pin className="h-3 w-3" aria-hidden />
          Épinglés
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={listTab === 'recent'}
          onClick={() => setListTab('recent')}
          className={`flex-1 min-h-[36px] rounded-xl text-[11px] font-semibold transition-all active:scale-[0.98] motion-reduce:active:scale-100 ${
            listTab === 'recent'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Récents
        </button>
      </div>

      <ul className="space-y-0.5 min-h-[4.5rem]">
        {listIds.length === 0 ? (
          <li className="px-2 py-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {listTab === 'pins'
              ? 'Épingle un onglet via ★ dans Récents (max 3).'
              : 'Navigue dans le dashboard : tes derniers écrans apparaîtront ici.'}
          </li>
        ) : (
          listIds.map((id) => {
            const def = catalogMap.get(id);
            if (!def) return null;
            const Icon = def.Icon;
            const isActive = activeQuickId === id;
            const isPinned = pins.includes(id);
            const badge = getBadge?.(id);
            return (
              <li key={`${listTab}-${id}`}>
                <div
                  className={`flex w-full items-center gap-0.5 rounded-lg ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800/70'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onNavigate(id)}
                    className={`flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-xs font-medium transition-all active:scale-[0.98] motion-reduce:active:scale-100 ${
                      isActive
                        ? 'text-zinc-900 dark:text-white'
                        : 'text-zinc-900 dark:text-zinc-200'
                    }`}
                  >
                    <Icon
                      className="h-3.5 w-3.5 shrink-0 opacity-80"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className="flex-1 text-left truncate">{def.label}</span>
                    {badge != null && badge > 0 && (
                      <span className="shrink-0 rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </button>
                  {listTab === 'recent' && (
                    <button
                      type="button"
                      onClick={(e) => handlePinClick(e, id)}
                      className={`shrink-0 p-1.5 mr-0.5 rounded-md transition-colors active:scale-[0.98] ${
                        isPinned
                          ? 'text-zinc-900 dark:text-white'
                          : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                      }`}
                      aria-label={isPinned ? 'Retirer des épinglés' : 'Épingler'}
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${isPinned ? 'fill-current' : ''}`}
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </button>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
