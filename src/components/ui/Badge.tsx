import React from 'react';
import { cn } from '@/lib/utils';

const variantClasses = {
  default:
    'bg-primary/15 text-primary border-primary/20',
  secondary:
    'bg-secondary text-secondary-foreground border-secondary',
  destructive:
    'bg-destructive/15 text-destructive border-destructive/20',
  warning:
    'bg-warning/15 text-warning border-warning/20',
  outline:
    'bg-transparent text-foreground border-border',
} as const;

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variantClasses;
}

export function Badge({
  variant = 'default',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
