import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { inkOledCard } from '@/lib/inkDesignTokens';

export const inkCardVariants = cva(cn(inkOledCard, 'dark:text-white'), {
  variants: {
    variant: {
      default: '',
      muted: 'dark:bg-black',
      glass: 'ink-oled-glass dark:bg-transparent',
    },
    padding: {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
  },
});

export interface InkCardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof inkCardVariants> {}

export const InkCard = React.forwardRef<HTMLDivElement, InkCardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div ref={ref} className={cn(inkCardVariants({ variant, padding }), className)} {...props} />
  )
);
InkCard.displayName = 'InkCard';
