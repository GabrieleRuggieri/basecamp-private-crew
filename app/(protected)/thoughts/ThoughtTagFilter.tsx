'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { ThoughtTag } from '@/lib/actions/thoughts';

const TAGS: { value: ThoughtTag | null; label: string }[] = [
  { value: null, label: 'Tutti' },
  { value: 'side_quest', label: 'Side quest' },
  { value: 'riflessione', label: 'Riflessione' },
  { value: 'proposta', label: 'Proposta' },
];

export function ThoughtTagFilter({ currentTag }: { currentTag: ThoughtTag | null }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {TAGS.map(({ value, label }) => {
        const href = value ? `${pathname}?tag=${value}` : pathname;
        const isActive = currentTag === value;

        return (
          <Link
            key={value ?? 'all'}
            href={href}
            className={cn(
              'px-3 py-1.5 rounded-lg text-footnote font-medium transition-colors',
              isActive
                ? 'bg-accent-purple/25 text-accent-purple'
                : 'bg-surface-elevated text-text-tertiary hover:text-text-secondary'
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
