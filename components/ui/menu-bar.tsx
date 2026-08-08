import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MenuBarItem {
  icon: LucideIcon;
  label: string;
  badgeCount?: number;
}

export interface MenuBarCenterSlot {
  /** Index après lequel insérer le slot (ex. 2 = entre le 2e et 3e item). */
  afterIndex: number;
  node: React.ReactNode;
}

export interface MenuBarProps {
  items: MenuBarItem[];
  activeIndex: number | null;
  onItemPress: (index: number) => void;
  centerSlot?: MenuBarCenterSlot;
  className?: string;
}

export function MenuBar({ items, activeIndex, onItemPress, centerSlot, className }: MenuBarProps) {
  const renderItem = (item: MenuBarItem, index: number) => {
    const Icon = item.icon;
    const isActive = activeIndex === index;
    return (
      <button
        key={`${item.label}-${index}`}
        type="button"
        aria-current={isActive ? 'page' : undefined}
        aria-label={item.label}
        onClick={() => onItemPress(index)}
        className={cn(
          'relative flex size-11 shrink-0 items-center justify-center rounded-full transition-colors touch-manipulation min-w-[44px] min-h-[44px]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900',
          'active:scale-[0.96] motion-reduce:active:scale-100',
          isActive
            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
            : 'text-zinc-600 hover:bg-zinc-100/90 dark:text-zinc-400 dark:hover:bg-zinc-800/80'
        )}
      >
        <Icon className="size-[18px]" strokeWidth={isActive ? 2 : 1.75} aria-hidden />
        {item.badgeCount != null && item.badgeCount > 0 ? (
          <span
            className="absolute -right-0.5 -top-0.5 flex min-w-[16px] h-4 items-center justify-center rounded-md bg-zinc-900 px-1 text-[9px] font-bold tabular-nums text-white dark:bg-white dark:text-zinc-900"
            aria-hidden
          >
            {item.badgeCount > 99 ? '99+' : item.badgeCount}
          </span>
        ) : null}
      </button>
    );
  };

  const itemNodes: React.ReactNode[] = [];
  items.forEach((item, index) => {
    itemNodes.push(renderItem(item, index));
    if (centerSlot && centerSlot.afterIndex === index) {
      itemNodes.push(
        <div key="menu-bar-center" className="flex shrink-0 items-center justify-center px-0.5">
          {centerSlot.node}
        </div>
      );
    }
  });

  return (
    <div className={cn('relative flex justify-center', className)}>
      <div
        className={cn(
          'relative z-10 inline-flex min-h-[52px] items-center gap-0.5 overflow-visible px-1.5',
          'rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl',
          'border border-zinc-200/70 dark:border-zinc-800/80',
          'shadow-[0_8px_24px_-8px_rgba(9,9,11,0.18)] dark:shadow-[0_8px_28px_-6px_rgba(0,0,0,0.55)]'
        )}
      >
        {itemNodes}
      </div>
    </div>
  );
}
