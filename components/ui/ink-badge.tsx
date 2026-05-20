import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inkBadgeVariants = cva(
  'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default:
          'bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800',
        muted:
          'bg-zinc-900 text-zinc-400 ring-1 ring-inset ring-zinc-800 dark:bg-zinc-900 dark:text-zinc-400',
        active:
          'bg-zinc-800 text-white ring-1 ring-inset ring-zinc-700 dark:bg-zinc-800 dark:text-white',
        warning:
          'bg-zinc-900 text-amber-200/90 ring-1 ring-inset ring-amber-900/40 dark:bg-zinc-900',
        danger: 'bg-zinc-950 text-red-400/80 ring-1 ring-inset ring-zinc-800 dark:bg-zinc-950',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type InkBadgeProps = React.ComponentProps<'span'> & VariantProps<typeof inkBadgeVariants>;

function InkBadge({ className, variant, ...props }: InkBadgeProps) {
  return <span className={cn(inkBadgeVariants({ variant }), className)} {...props} />;
}

export { InkBadge, inkBadgeVariants };
