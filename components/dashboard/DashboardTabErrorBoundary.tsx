import type { ReactNode } from 'react';
import { ErrorBoundary, type ErrorBoundaryFallbackRender } from '../ErrorBoundary';
import { AlertTriangle } from 'lucide-react';

type DashboardTabErrorBoundaryProps = {
  children: ReactNode;
  /** Section name for accessible context and optional error detail in dev */
  sectionLabel: string;
};

const fallback =
  (label: string): ErrorBoundaryFallbackRender =>
  ({ error, reset }) => (
    <div
      className="min-w-0 rounded-2xl border border-red-200/90 dark:border-red-900/40 bg-red-50/90 dark:bg-red-950/25 px-4 py-6 sm:px-8 sm:py-8 text-center"
      role="alert"
    >
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 mb-3">
        <AlertTriangle className="w-5 h-5" aria-hidden />
      </div>
      <h2 className="text-base font-semibold text-zinc-900 dark:text-white mb-1">
        Cette section est indisponible
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">{label}</p>
      {import.meta.env.DEV && error?.message && (
        <p className="text-xs text-left text-red-800/80 dark:text-red-300/90 font-mono break-all bg-red-100/50 dark:bg-red-900/20 rounded-lg p-2 mb-4">
          {error.message}
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-2 inline-flex items-center justify-center rounded-xl bg-blue-600 text-white dark:bg-blue-500 px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-400 transition-colors"
      >
        Réessayer
      </button>
    </div>
  );

export function DashboardTabErrorBoundary({
  children,
  sectionLabel,
}: DashboardTabErrorBoundaryProps) {
  return <ErrorBoundary fallback={fallback(sectionLabel)}>{children}</ErrorBoundary>;
}
