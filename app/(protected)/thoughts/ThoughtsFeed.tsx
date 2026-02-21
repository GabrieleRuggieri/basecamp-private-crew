/**
 * Feed pensieri: card con avatar, autore, contenuto, reazioni emoji e commenti.
 */
'use client';

import { useState } from 'react';
import { MemberAvatar } from '@/components/MemberAvatar';
import { addReaction, addComment, removeReaction } from '@/lib/actions/reactions';
import type { ReactionSummary } from '@/lib/actions/reactions';
import type { Thought } from '@/lib/types';

type ThoughtWithAuthor = Thought & {
  author?: { name: string; emoji: string } | null;
};

export function ThoughtsFeed({
  thoughts,
  currentMemberId,
  reactionsMap,
}: {
  thoughts: ThoughtWithAuthor[];
  currentMemberId: string;
  reactionsMap: Map<string, ReactionSummary>;
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
            reactionSummary={reactionsMap.get(t.id)}
          />
        ))
      )}
    </div>
  );
}

function ThoughtCard({
  thought,
  currentMemberId,
  reactionSummary,
}: {
  thought: ThoughtWithAuthor;
  currentMemberId: string;
  reactionSummary?: ReactionSummary;
}) {
  const [commentDraft, setCommentDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { emojiCounts = [], comments = [] } = reactionSummary ?? {};
  const myComment = comments.find((c) => c.memberId === currentMemberId);

  async function handleEmojiClick(emoji: string, hasReacted: boolean) {
    if (hasReacted) {
      await removeReaction('thought', thought.id);
    } else {
      await addReaction('thought', thought.id, emoji);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = commentDraft.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    await addComment('thought', thought.id, trimmed);
    setCommentDraft('');
    setIsSubmitting(false);
  }

  return (
    <div className="card p-4 rounded-xl animate-fade-in">
      <div className="flex gap-3">
        <MemberAvatar
          emoji={thought.anonymous ? '?' : thought.author?.emoji ?? '👤'}
          name={thought.anonymous ? 'Anonimo' : thought.author?.name ?? 'Unknown'}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex gap-2 flex-wrap mb-1">
            <span className="text-text-secondary text-xs">
              {thought.anonymous ? 'Anonimo' : thought.author?.name}
            </span>
            {thought.tags?.length > 0 &&
              thought.tags.map((tag) => (
                <span key={tag} className="text-accent-purple text-xs">
                  #{tag.replace('_', ' ')}
                </span>
              ))}
          </div>
          <p className="text-text-primary">{thought.content}</p>

          <div className="flex gap-2 mt-2 flex-wrap">
            {emojiCounts.map((r) => (
              <button
                key={r.emoji}
                onClick={() => handleEmojiClick(r.emoji, r.hasReacted)}
                className={`text-sm transition-opacity ${
                  r.hasReacted ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                }`}
              >
                {r.emoji} {r.count > 0 && r.count}
              </button>
            ))}
          </div>

          {comments.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-[var(--card-border)] pt-3">
              {comments.map((c) => (
                <div key={c.memberId} className="flex gap-2 items-start">
                  <MemberAvatar emoji={c.memberEmoji} name={c.memberName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <span className="text-text-secondary text-xs">{c.memberName}</span>
                    <p className="text-text-primary text-sm mt-0.5">{c.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!myComment ? (
            <form onSubmit={handleSubmitComment} className="mt-3">
              <input
                type="text"
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Aggiungi un commento..."
                className="w-full bg-surface-elevated border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary"
                maxLength={500}
              />
              {commentDraft.trim() && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 text-sm text-accent-purple font-medium"
                >
                  Invia
                </button>
              )}
            </form>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-text-tertiary text-sm italic">Il tuo commento: {myComment.comment}</span>
              <button
                onClick={() => removeReaction('thought', thought.id)}
                className="text-xs text-text-tertiary hover:text-text-secondary"
              >
                Rimuovi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
