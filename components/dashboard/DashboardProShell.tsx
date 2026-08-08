import React from 'react';
import { AntdMobileDashboardProvider } from './AntdMobileDashboardProvider';
import { cn } from '@/lib/utils';

type DashboardProShellProps = {
  isDark: boolean;
  isInkflowProShell: boolean;
  children: React.ReactNode;
};

/** Enveloppe racine dashboard Pro — provider antd-mobile + conteneur `.app-shell`. */
export function DashboardProShell({ isDark, isInkflowProShell, children }: DashboardProShellProps) {
  return (
    <AntdMobileDashboardProvider isDark={isDark}>
      <div
        className={cn(
          'app-shell dashboard-pro-shell bg-background text-foreground',
          isInkflowProShell && 'dashboard-pro-inkflow-pro-shell'
        )}
        data-lenis-prevent
      >
        {children}
      </div>
    </AntdMobileDashboardProvider>
  );
}

type DashboardProSidebarBackdropProps = {
  open: boolean;
  onClose: () => void;
};

/** Overlay mobile derrière la sidebar drawer. */
export function DashboardProSidebarBackdrop({ open, onClose }: DashboardProSidebarBackdropProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] motion-reduce:backdrop-blur-none transition-opacity duration-200 lg:hidden"
      onClick={onClose}
      aria-hidden="true"
    />
  );
}

type DashboardProShellRowProps = {
  children: React.ReactNode;
  className?: string;
};

/** Ligne principale : sidebar + colonne centrale + panneau planning (xl+). */
export function DashboardProShellRow({ children, className }: DashboardProShellRowProps) {
  return <div className={cn('app-shell-row', className)}>{children}</div>;
}
