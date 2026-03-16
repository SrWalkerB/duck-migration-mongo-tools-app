import { cn } from '@/lib/utils';

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
} as const;

interface ProgressBarProps {
  value: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function ProgressBar({
  value,
  label,
  size = 'md',
  color,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || true) && (
        <div className="flex items-center justify-between text-sm">
          {label && (
            <span className="font-medium text-foreground">{label}</span>
          )}
          <span className="text-muted-foreground ml-auto tabular-nums">
            {Math.round(clamped)}%
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-secondary',
          sizeClasses[size],
        )}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-in-out',
            !color && 'bg-primary',
          )}
          style={{
            width: `${clamped}%`,
            ...(color ? { backgroundColor: color } : {}),
          }}
        />
      </div>
    </div>
  );
}
