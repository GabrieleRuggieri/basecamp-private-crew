/**
 * Card membro crew con reazioni emoji e commenti.
 */
'use client';

import { useState } from 'react';
import { MemberAvatar } from '@/components/MemberAvatar';
import { addReaction, addComment, removeReaction } from '@/lib/actions/reactions';
import type { ReactionSummary } from '@/lib/actions/reactions';
import type { CrewMemberWithStats } from '@/lib/actions/training-crew';

export function CrewMemberCard({
  member,
  targetType,
  reactionSummary,
  currentMemberId,
}: {
  member: CrewMemberWithStats;
  targetType: string;
  reactionSummary?: ReactionSummary;
  currentMemberId: string;
}) {
  const [commentDraft, setCommentDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { emojiCounts = [], comments = [] } = reactionSummary ?? {};
  const myComment = comments.find((c) => c.memberId === currentMemberId);

  async function handleEmojiClick(emoji: string, hasReacted: boolean) {
    if (hasReacted) {
      await removeReaction(targetType, member.id);
    } else {
      await addReaction(targetType, member.id, emoji);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = commentDraft.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    await addComment(targetType, member.id, trimmed);
    setCommentDraft('');
    setIsSubmitting(false);
  }

  return (
    <div className="card p-4 rounded-xl animate-fade-in">
      <div className="flex gap-4">
        <MemberAvatar emoji={member.emoji} name={member.name} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-subhead font-semibold text-text-primary">{member.name}</p>
          <p className="text-footnote text-text-tertiary mt-0.5">
            PR: {member.pr_count ?? 0} · Sessions: {member.sessions_count ?? 0}
          </p>

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
                placeholder="Add a comment..."
                className="w-full bg-surface-elevated border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary"
                maxLength={500}
              />
              {commentDraft.trim() && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 text-sm text-accent-purple font-medium"
                >
                  Send
                </button>
              )}
            </form>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-text-tertiary text-sm italic">Your comment: {myComment.comment}</span>
              <button
                onClick={() => removeReaction(targetType, member.id)}
                className="text-xs text-text-tertiary hover:text-text-secondary"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
