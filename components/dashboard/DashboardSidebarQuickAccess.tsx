import React, { useMemo, useState } from 'react';
import { Pin, Star } from 'lucide-react';
import {
  QUICK_ACCESS_CATALOG,
  QUICK_ACCESS_MAX_PINS,
  type QuickAccessItemId,
} from '../../lib/dashboardQuickAccess';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getQuickAccessLabel } from '../../lib/dashboardI18n';

export interface DashboardSidebarQuickAccessProps {
  pins: QuickAccessItemId[];
  recents: QuickAccessItemId[];
  insight: {
    id: string;
    eyebrow: string;
    title: string;
    cta: string;
    targetId: QuickAccessItemId;
    badge?: number;
    variant: 'alert' | 'today' | 'calm';
  };
  activeQuickId: QuickAccessItemId | null;
  onNavigate: (id: QuickAccessItemId) => void;
  onTogglePin: (id: QuickAccessItemId) => { atMax: boolean };
  getBadge?: (id: QuickAccessItemId) => number | undefined;
}

export function DashboardSidebarQuickAccess({
  pins,
  recents,
  insight: _insight,
  activeQuickId,
  onNavigate,
  onTogglePin,
  getBadge,
}: DashboardSidebarQuickAccessProps) {
  const toast = useToast();
  const { t } = useLanguage();
  const [listTab, setListTab] = useState<'pins' | 'recent'>('pins');

  const catalogMap = useMemo(() => new Map(QUICK_ACCESS_CATALOG.map((c) => [c.id, c])), []);

  const listIds = listTab === 'pins' ? pins : recents;

  const handlePinClick = (e: React.MouseEvent, id: QuickAccessItemId) => {
    e.stopPropagation();
    const { atMax } = onTogglePin(id);
    if (atMax) {
      toast.error(t('dashboard.quickAccess.maxPins').replace('{n}', String(QUICK_ACCESS_MAX_PINS)));
    }
  };

  return (
    <div className="relative z-10 px-4 pt-3 pb-2">
      <div
        className="flex rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 p-1 gap-0.5 mb-1.5"
        role="tablist"
        aria-label={t('dashboard.quickAccess.aria')}
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
          {t('dashboard.quickAccess.pinned')}
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
          {t('dashboard.quickAccess.recent')}
        </button>
      </div>

      <ul className="space-y-0.5 min-h-[4.5rem]">
        {listIds.length === 0 ? (
          <li className="px-2 py-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {listTab === 'pins'
              ? t('dashboard.quickAccess.emptyPins')
              : t('dashboard.quickAccess.emptyRecents')}
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
                    <span className="flex-1 text-left truncate">{getQuickAccessLabel(t, id)}</span>
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
