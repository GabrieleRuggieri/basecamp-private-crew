/**
 * Placeholder card con animazione pulse per stati di caricamento.
 */
import { cn } from '@/lib/utils';

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'card p-4 animate-pulse',
        className
      )}
    >
      <div className="h-4 bg-surface-elevated rounded w-3/4 mb-3" />
      <div className="h-3 bg-surface-elevated rounded w-1/2" />
    </div>
  );
}
