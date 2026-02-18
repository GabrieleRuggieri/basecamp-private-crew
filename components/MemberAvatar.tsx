/**
 * Avatar membro: emoji in cerchio, size sm/md/lg, opzionale ring colorato (Today's pulse).
 */
import { cn } from '@/lib/utils';

type Props = {
  emoji: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  ringColor?: string;
  showRing?: boolean;
  className?: string;
};

const SIZES = {
  sm: 'w-9 h-9 text-base',
  md: 'w-12 h-12 text-xl',
  lg: 'w-14 h-14 text-2xl',
};

export function MemberAvatar({
  emoji,
  name,
  size = 'md',
  ringColor,
  showRing = false,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center bg-surface border border-[var(--card-border)]',
        SIZES[size],
        className
      )}
      style={
        showRing && ringColor
          ? { boxShadow: `0 0 0 2px ${ringColor}` }
          : undefined
      }
      title={name}
    >
      <span>{emoji}</span>
    </div>
  );
}
