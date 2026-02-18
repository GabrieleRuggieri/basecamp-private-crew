/**
 * Feed pensieri: card con avatar, autore (o Anonimo), contenuto, mood tag, reazioni (placeholder).
 */
'use client';

import { MemberAvatar } from '@/components/MemberAvatar';
import { addReaction, removeReaction } from '@/lib/actions/reactions';
import type { Thought } from '@/lib/types';

type ThoughtWithAuthor = Thought & {
  author?: { name: string; emoji: string } | null;
};

export function ThoughtsFeed({
  thoughts,
  currentMemberId,
}: {
  thoughts: ThoughtWithAuthor[];
  currentMemberId: string;
}) {
  return (
    <div className="space-y-4">
      {thoughts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-subhead text-text-tertiary">Nessun thought ancora</p>
          <p className="text-caption text-text-tertiary mt-2">Scrivi il primo</p>
        </div>
      ) : (
        thoughts.map((t) => (
          <ThoughtCard
            key={t.id}
            thought={t}
            currentMemberId={currentMemberId}
          />
        ))
      )}
    </div>
  );
}

function ThoughtCard({
  thought,
  currentMemberId,
}: {
  thought: ThoughtWithAuthor;
  currentMemberId: string;
}) {
  const REACTIONS = ['❤️', '😂', '🤔', '🔥'];
  // TODO: fetch reactions from DB
  const reactions: { emoji: string; count: number; hasReacted: boolean }[] = REACTIONS.map(
    (e) => ({ emoji: e, count: 0, hasReacted: false })
  );

  return (
    <div className="card p-4 rounded-xl animate-fade-in">
      <div className="flex gap-3">
        <MemberAvatar
          emoji={thought.anonymous ? '?' : thought.author?.emoji ?? '👤'}
          name={thought.anonymous ? 'Anonimo' : thought.author?.name ?? 'Unknown'}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="text-text-secondary text-xs mb-1">
            {thought.anonymous ? 'Anonimo' : thought.author?.name}
            {thought.mood_tag && (
              <span className="ml-2 text-accent-purple">#{thought.mood_tag}</span>
            )}
          </p>
          <p className="text-text-primary">{thought.content}</p>
          <div className="flex gap-2 mt-2">
            {reactions.map((r) => (
              <button
                key={r.emoji}
                className="text-sm opacity-70 hover:opacity-100 transition-opacity"
              >
                {r.emoji} {r.count > 0 && r.count}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
