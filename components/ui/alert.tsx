import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-2xl border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive:
          'bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current',
        /** Acomptes, facturation, garde-fous — marque blue-600 + surfaces claires (pas d’ambre) */
        warning:
          'border-blue-200/90 bg-white text-zinc-950 *:[svg]:text-blue-600 *:data-[slot=alert-description]:text-zinc-950 dark:border-blue-500/30 dark:bg-zinc-900 dark:text-zinc-100 dark:*:[svg]:text-blue-400 dark:*:data-[slot=alert-description]:text-zinc-100/95',
        /** Rappels calendrier, infos pro */
        info: 'border-blue-200/90 bg-white text-foreground *:[svg]:text-blue-600 *:data-[slot=alert-description]:text-foreground/95 dark:border-blue-500/30 dark:bg-zinc-900 dark:text-zinc-100 dark:*:[svg]:text-blue-400 dark:*:data-[slot=alert-description]:text-zinc-100/90',
        /** Paiement / accès bloqué */
        critical:
          'border-red-200/90 bg-red-50/95 text-red-900 *:[svg]:text-red-600 *:data-[slot=alert-description]:text-red-900 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100 dark:*:[svg]:text-red-400 dark:*:data-[slot=alert-description]:text-red-100/95',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Alert({
  className,
  variant,
  role,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      className={cn(alertVariants({ variant }), className)}
      role={role ?? 'alert'}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground',
        className
      )}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4',
        className
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-action"
      className={cn('absolute top-2.5 right-3', className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
