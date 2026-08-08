import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-2xl bg-muted', className)}
      {...props}
    />
  );
}

/** Affiché pendant le chargement du chunk `ImageCropModal` (react-easy-crop). */
export function ImageCropModalSuspenseFallback() {
  return (
    <div
      className="flex min-h-48 flex-col items-center justify-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6"
      role="status"
      aria-live="polite"
      aria-label="Chargement du recadrage"
    >
      <Loader2
        className="h-8 w-8 animate-spin text-[var(--text-tertiary)]"
        strokeWidth={1.75}
        aria-hidden
      />
      <div className="w-full max-w-sm space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

/** Lignes factices pour liste de notifications en chargement. */
export function NotificationListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-[var(--border)] py-2" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="space-y-2 px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 flex-1 max-w-[70%]" />
            <Skeleton className="h-3 w-14 shrink-0" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton };
