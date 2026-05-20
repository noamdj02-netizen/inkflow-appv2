import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inkButtonVariants = cva(
  'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:active:scale-100',
  {
    variants: {
      variant: {
        primary:
          'border border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800',
        secondary:
          'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900',
        ghost:
          'border border-transparent bg-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900',
        danger:
          'border border-zinc-800 bg-zinc-950 text-red-400/90 hover:bg-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-red-400/80',
      },
      size: {
        default: 'min-h-11 px-4',
        sm: 'min-h-9 px-3 text-xs',
        icon: 'size-11 min-h-11 min-w-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface InkButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof inkButtonVariants> {
  asChild?: boolean;
}

const InkButton = React.forwardRef<HTMLButtonElement, InkButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : 'button';
    return (
      <Comp ref={ref} className={cn(inkButtonVariants({ variant, size }), className)} {...props} />
    );
  }
);
InkButton.displayName = 'InkButton';

export { InkButton, inkButtonVariants };
