/**
 * Server Actions per reazioni (emoji o commento su thoughts, moments, ecc).
 * addReaction: aggiunge/toggle reazione emoji (upsert).
 * addComment: aggiunge/sostituisce commento (upsert).
 * removeReaction: rimuove la reazione del membro (solo la propria).
 * getReactionsForTargets: fetch emoji counts e commenti per target.
 * Le actions usano sempre session.memberId — non si accetta memberId dal client.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/actions/auth';

export type ReactionSummary = {
  emojiCounts: { emoji: string; count: number; hasReacted: boolean }[];
  comments: { memberId: string; memberName: string; memberEmoji: string; comment: string }[];
};

export async function getReactionsForTargets(
  targetType: string,
  targetIds: string[],
  currentMemberId: string
): Promise<Map<string, ReactionSummary>> {
  if (targetIds.length === 0) return new Map();

  const { data: reactions } = await supabase
    .from('reactions')
    .select('member_id, target_id, emoji, comment')
    .eq('target_type', targetType)
    .in('target_id', targetIds);

  const memberIds = Array.from(new Set((reactions ?? []).map((r) => r.member_id)));
  const { data: members } = await supabase
    .from('members')
    .select('id, name, emoji')
    .in('id', memberIds);

  const memberMap = new Map((members ?? []).map((m) => [m.id, m]));

  const DEFAULT_EMOJIS = ['❤️', '😂', '😍', '🤔', '🔥'];
  const result = new Map<string, ReactionSummary>();

  for (const targetId of targetIds) {
    const targetReactions = (reactions ?? []).filter((r) => r.target_id === targetId);
    const emojiReactions = targetReactions.filter((r) => r.emoji);
    const commentReactions = targetReactions.filter((r) => r.comment);

    const emojiCounts = new Map<string, { count: number; memberIds: Set<string> }>();
    for (const e of DEFAULT_EMOJIS) {
      emojiCounts.set(e, { count: 0, memberIds: new Set() });
    }
    for (const r of emojiReactions) {
      if (r.emoji) {
        const cur = emojiCounts.get(r.emoji) ?? { count: 0, memberIds: new Set<string>() };
        cur.count += 1;
        cur.memberIds.add(r.member_id);
        emojiCounts.set(r.emoji, cur);
      }
    }

    const emojiCountsArr = DEFAULT_EMOJIS.map((emoji) => {
      const { count, memberIds: ids } = emojiCounts.get(emoji) ?? { count: 0, memberIds: new Set<string>() };
      return { emoji, count, hasReacted: ids.has(currentMemberId) };
    });

    const comments = commentReactions.map((r) => {
      const m = memberMap.get(r.member_id);
      return {
        memberId: r.member_id,
        memberName: m?.name ?? 'Unknown',
        memberEmoji: m?.emoji ?? '👤',
        comment: r.comment ?? '',
      };
    });

    result.set(targetId, { emojiCounts: emojiCountsArr, comments });
  }

  return result;
}

export async function addReaction(targetType: string, targetId: string, emoji: string) {
  const session = await getSession();
  if (!session) return;

  const { error } = await supabase.from('reactions').upsert(
    { member_id: session.memberId, target_type: targetType, target_id: targetId, emoji, comment: null },
    { onConflict: 'member_id,target_type,target_id' }
  );
  if (error) console.error('addReaction', error);
  revalidatePath('/thoughts');
  revalidatePath('/home');
}

export async function addComment(targetType: string, targetId: string, comment: string) {
  const session = await getSession();
  if (!session) return;

  const trimmed = comment.trim();
  if (!trimmed) return;

  const { error } = await supabase.from('reactions').upsert(
    { member_id: session.memberId, target_type: targetType, target_id: targetId, emoji: null, comment: trimmed },
    { onConflict: 'member_id,target_type,target_id' }
  );
  if (error) console.error('addComment', error);
  revalidatePath('/thoughts');
  revalidatePath('/home');
}

export async function removeReaction(targetType: string, targetId: string) {
  const session = await getSession();
  if (!session) return;

  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('member_id', session.memberId)
    .eq('target_type', targetType)
    .eq('target_id', targetId);
  if (error) console.error('removeReaction', error);
  revalidatePath('/thoughts');
  revalidatePath('/home');
}
