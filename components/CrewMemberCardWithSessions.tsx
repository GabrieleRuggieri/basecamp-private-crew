/**
 * Card membro crew con lista sessioni (ultime 3 visibili, espandibile)
 * e reazioni emoji/commenti su ogni sessione.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MemberAvatar } from '@/components/MemberAvatar';
import { addReaction, addComment, removeReaction } from '@/lib/actions/reactions';
import type { ReactionSummary } from '@/lib/actions/reactions';
import type { CrewMemberWithSessions, CrewSessionWithSets } from '@/lib/actions/training-crew';

const MOOD_EMOJI: Record<number, string> = {
  1: '💀',
  2: '😓',
  3: '😐',
  4: '💪',
  5: '🔥',
};
import { ChevronDown, ChevronUp } from 'lucide-react';

function formatSessionDate(endedAt: string | null) {
  if (!endedAt) return '—';
  const d = new Date(endedAt);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Oggi';
  if (d.toDateString() === yesterday.toDateString()) return 'Ieri';
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function SessionCard({
  session,
  reactionSummary,
  currentMemberId,
}: {
  session: CrewSessionWithSets;
  reactionSummary?: ReactionSummary;
  currentMemberId: string;
}) {
  const router = useRouter();
  const [commentDraft, setCommentDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(false);
  const [commentEditValue, setCommentEditValue] = useState('');

  const { emojiCounts = [], comments = [] } = reactionSummary ?? {};
  const myComment = comments.find((c) => c.memberId === currentMemberId);

  async function handleEmojiClick(emoji: string, hasReacted: boolean) {
    if (hasReacted) {
      await removeReaction('gym_session', session.id);
    } else {
      await addReaction('gym_session', session.id, emoji);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = commentDraft.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    await addComment('gym_session', session.id, trimmed);
    setCommentDraft('');
    setIsSubmitting(false);
  }

  const setsSummary = session.sets
    .reduce((acc, s) => {
      const key = s.exercise_name.trim() || '?';
      if (!acc[key]) acc[key] = [] as { w: number | null; r: number | null }[];
      acc[key].push({ w: s.weight_kg, r: s.reps });
      return acc;
    }, {} as Record<string, { w: number | null; r: number | null }[]>);

  const setsText = Object.entries(setsSummary)
    .map(([ex, arr]) => {
      const parts = arr.map((x) => (x.w ? `${x.w}×${x.r ?? '?'}` : `${x.r ?? '?'}`));
      return `${ex}: ${parts.join(', ')}`;
    })
    .join(' · ');

  return (
    <div className="bg-surface-elevated rounded-lg p-3 border border-[var(--card-border)]">
      <div className="flex items-center gap-2 text-footnote text-text-tertiary">
        <span>{formatSessionDate(session.ended_at)}</span>
        {session.duration_minutes != null && (
          <span>· {session.duration_minutes} min</span>
        )}
        {session.mood != null && (
          <span>{MOOD_EMOJI[session.mood] ?? ''}</span>
        )}
      </div>
      {setsText && (
        <p className="text-sm text-text-secondary mt-1 line-clamp-2">{setsText}</p>
      )}

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
        <div className="mt-2 space-y-1.5 border-t border-[var(--card-border)] pt-2">
          {comments.map((c) => (
            <div key={c.memberId} className="flex gap-2 items-start">
              <MemberAvatar emoji={c.memberEmoji} name={c.memberName} size="sm" />
              <div className="flex-1 min-w-0">
                <span className="text-text-tertiary text-xs">{c.memberName}</span>
                <p className="text-text-primary text-xs mt-0.5">{c.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!myComment ? (
        <form onSubmit={handleSubmitComment} className="mt-2">
          <input
            type="text"
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder="Comment..."
            className="w-full bg-transparent border border-[var(--card-border)] rounded-lg px-2 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary"
            maxLength={500}
          />
          {commentDraft.trim() && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 text-xs text-accent-purple font-medium"
            >
              Send
            </button>
          )}
        </form>
      ) : (
        <div className="mt-2 flex flex-col gap-1">
          {editingComment ? (
            <>
              <input
                type="text"
                value={commentEditValue}
                onChange={(e) => setCommentEditValue(e.target.value)}
                className="w-full bg-transparent border border-[var(--card-border)] rounded-lg px-2 py-1.5 text-xs text-text-primary"
                maxLength={500}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!commentEditValue.trim() || isSubmitting) return;
                    setIsSubmitting(true);
                    await addComment('gym_session', session.id, commentEditValue.trim());
                    setEditingComment(false);
                    router.refresh();
                    setIsSubmitting(false);
                  }}
                  disabled={!commentEditValue.trim() || isSubmitting}
                  className="text-xs text-accent-purple font-medium"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingComment(false);
                    setCommentEditValue(myComment.comment);
                  }}
                  className="text-xs text-text-tertiary"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-text-tertiary text-xs italic">Your comment: {myComment.comment}</span>
              <button
                type="button"
                onClick={() => {
                  setCommentEditValue(myComment.comment);
                  setEditingComment(true);
                }}
                className="text-xs text-text-tertiary hover:text-accent-purple"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => removeReaction('gym_session', session.id)}
                className="text-xs text-text-tertiary hover:text-text-secondary"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CrewMemberCardWithSessions({
  member,
  reactionsBySessionId,
  currentMemberId,
}: {
  member: CrewMemberWithSessions;
  reactionsBySessionId: Map<string, ReactionSummary>;
  currentMemberId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const limit = 3;
  const sessionsToShow = expanded ? member.sessions : member.sessions.slice(0, limit);
  const hasMore = member.sessions_total > limit;

  return (
    <div className="card p-4 rounded-xl animate-fade-in">
      <div className="flex gap-4">
        <MemberAvatar emoji={member.emoji} name={member.name} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-subhead font-semibold text-text-primary">{member.name}</p>
          <p className="text-footnote text-text-tertiary mt-0.5">
            PR: {member.pr_count ?? 0} · Sessioni: {member.sessions_count ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {sessionsToShow.length === 0 ? (
          <p className="text-footnote text-text-tertiary">No sessions</p>
        ) : (
          sessionsToShow.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              reactionSummary={reactionsBySessionId.get(session.id)}
              currentMemberId={currentMemberId}
            />
          ))
        )}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-footnote text-accent-purple tap-target"
        >
          {expanded ? (
            <>
              <ChevronUp size={16} />
              Mostra meno
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              Vedi tutte ({member.sessions_total})
            </>
          )}
        </button>
      )}
    </div>
  );
}
