import React from 'react';
import { cn } from '@/lib/utils';

const variantClasses = {
  info: 'border-primary/30 bg-primary/5 text-primary [&>svg]:text-primary',
  success: 'border-primary/30 bg-primary/5 text-primary [&>svg]:text-primary',
  warning: 'border-warning/30 bg-warning/5 text-warning [&>svg]:text-warning',
  error: 'border-destructive/30 bg-destructive/5 text-destructive [&>svg]:text-destructive',
} as const;

const icons: Record<string, string> = {
  info: 'i',
  success: '\u2713',
  warning: '!',
  error: '\u2715',
};

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variantClasses;
  title?: string;
}

export function Alert({
  variant = 'info',
  title,
  children,
  className,
  ...props
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'relative flex gap-3 rounded-lg border p-4',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
        {icons[variant]}
      </span>
      <div className="flex flex-col gap-1">
        {title && (
          <h5 className="font-medium leading-none">{title}</h5>
        )}
        {children && (
          <div className="text-sm opacity-90">{children}</div>
        )}
      </div>
    </div>
  );
}
