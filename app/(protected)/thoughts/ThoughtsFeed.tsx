/**
 * Feed pensieri: card con avatar, autore, contenuto, reazioni emoji e commenti.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MemberAvatar } from '@/components/MemberAvatar';
import { addReaction, addComment, removeReaction } from '@/lib/actions/reactions';
import { updateThought, type ThoughtTag } from '@/lib/actions/thoughts';
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

const THOUGHT_TAGS: { value: ThoughtTag; label: string }[] = [
  { value: 'side_quest', label: 'Side quest' },
  { value: 'riflessione', label: 'Riflessione' },
  { value: 'proposta', label: 'Proposta' },
];

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
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(thought.content);
  const [editTags, setEditTags] = useState<ThoughtTag[]>(thought.tags ?? []);
  const [editAnonymous, setEditAnonymous] = useState(thought.anonymous ?? false);
  const [editingComment, setEditingComment] = useState(false);
  const [commentEditValue, setCommentEditValue] = useState('');

  const isOwner = thought.member_id === currentMemberId;
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

  async function handleSaveEdit() {
    if (!editContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await updateThought(thought.id, currentMemberId, editContent.trim(), editTags, editAnonymous);
    setIsEditing(false);
    router.refresh();
    setIsSubmitting(false);
  }

  const toggleEditTag = (tag: ThoughtTag) => {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="card p-4 rounded-xl animate-fade-in">
      <div className="flex gap-3">
        <MemberAvatar
          emoji={thought.anonymous ? '?' : thought.author?.emoji ?? '👤'}
          name={thought.anonymous ? 'Anonimo' : thought.author?.name ?? 'Unknown'}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex gap-2 flex-wrap mb-1 items-center">
            <span className="text-text-secondary text-xs">
              {thought.anonymous ? 'Anonimo' : thought.author?.name}
            </span>
            {!isEditing && thought.tags?.length > 0 &&
              thought.tags.map((tag) => (
                <span key={tag} className="text-accent-purple text-xs">
                  #{tag.replace('_', ' ')}
                </span>
              ))}
            {isOwner && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs text-text-tertiary hover:text-accent-purple ml-auto"
              >
                Modifica
              </button>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-surface-elevated rounded-lg p-3 text-sm text-text-primary border border-[var(--card-border)] min-h-[80px] resize-none"
              />
              <div className="flex flex-wrap gap-1">
                {THOUGHT_TAGS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleEditTag(value)}
                    className={`px-2 py-1 rounded text-xs ${
                      editTags.includes(value)
                        ? 'bg-accent-purple/25 text-accent-purple'
                        : 'bg-surface text-text-tertiary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs text-text-secondary">
                <input
                  type="checkbox"
                  checked={editAnonymous}
                  onChange={(e) => setEditAnonymous(e.target.checked)}
                  className="rounded"
                />
                Anonimo
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim() || isSubmitting}
                  className="text-sm text-accent-purple font-medium"
                >
                  Salva
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(thought.content);
                    setEditTags(thought.tags ?? []);
                    setEditAnonymous(thought.anonymous ?? false);
                  }}
                  className="text-sm text-text-tertiary"
                >
                  Annulla
                </button>
              </div>
            </div>
          ) : (
            <p className="text-text-primary">{thought.content}</p>
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
            <div className="mt-2 flex flex-col gap-2">
              {editingComment ? (
                <>
                  <input
                    type="text"
                    value={commentEditValue}
                    onChange={(e) => setCommentEditValue(e.target.value)}
                    className="w-full bg-surface-elevated border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm text-text-primary"
                    maxLength={500}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!commentEditValue.trim() || isSubmitting) return;
                        setIsSubmitting(true);
                        await addComment('thought', thought.id, commentEditValue.trim());
                        setEditingComment(false);
                        router.refresh();
                        setIsSubmitting(false);
                      }}
                      disabled={!commentEditValue.trim() || isSubmitting}
                      className="text-sm text-accent-purple font-medium"
                    >
                      Salva
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingComment(false);
                        setCommentEditValue(myComment.comment);
                      }}
                      className="text-sm text-text-tertiary"
                    >
                      Annulla
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-text-tertiary text-sm italic">Il tuo commento: {myComment.comment}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCommentEditValue(myComment.comment);
                      setEditingComment(true);
                    }}
                    className="text-xs text-text-tertiary hover:text-accent-purple"
                  >
                    Modifica
                  </button>
                  <button
                    type="button"
                    onClick={() => removeReaction('thought', thought.id)}
                    className="text-xs text-text-tertiary hover:text-text-secondary"
                  >
                    Rimuovi
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
