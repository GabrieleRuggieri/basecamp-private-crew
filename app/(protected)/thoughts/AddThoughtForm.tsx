/**
 * Form per aggiungere un pensiero: textarea, mood tag, checkbox anonimo.
 * Dopo submit: addThought, router.refresh per aggiornamento in tempo reale.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addThought } from '@/lib/actions/thoughts';
import { cn } from '@/lib/utils';

const MOOD_TAGS = [
  'reflective',
  'hyped',
  'grateful',
  'random',
  'deep',
  'funny',
] as const;

export function AddThoughtForm({ memberId }: { memberId: string }) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [moodTag, setMoodTag] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await addThought(memberId, content.trim(), moodTag, anonymous);
    setContent('');
    setMoodTag(null);
    router.refresh();
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Cosa stai pensando?"
        className="w-full bg-surface rounded-xl p-4 text-body text-text-primary placeholder:text-text-tertiary border border-[var(--card-border)] focus:outline-none focus:border-accent-purple/50 min-h-[100px] resize-none transition-colors"
        required
      />
      <div className="flex flex-wrap gap-2 mt-3">
        {MOOD_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setMoodTag(moodTag === tag ? null : tag)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-footnote font-medium transition-colors',
              moodTag === tag
                ? 'bg-accent-purple/25 text-accent-purple'
                : 'bg-surface-elevated text-text-tertiary hover:text-text-secondary'
            )}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4">
        <label className="flex items-center gap-2 text-footnote text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="rounded border-[var(--separator)]"
          />
          Anonimo
        </label>
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className={cn(
            'btn px-6 rounded-xl',
            content.trim() && !isSubmitting
              ? 'bg-accent-purple text-white'
              : 'bg-surface-elevated text-text-tertiary cursor-not-allowed'
          )}
        >
          {isSubmitting ? '...' : 'Post'}
        </button>
      </div>
    </form>
  );
}
