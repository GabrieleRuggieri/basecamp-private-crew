/**
 * Feed unificato per la Home.
 * getUnifiedFeed: unisce thoughts e gym_sessions, ordina per data, max 30 item.
 * Usato nella sezione Feed della home.
 */
'use server';

import { supabase } from '@/lib/supabase';

export type FeedItem = {
  id: string;
  type: 'thought' | 'gym' | 'travel' | 'watchlist' | 'moment';
  created_at: string;
  author?: { name: string; emoji: string };
  content?: string;
  payload?: Record<string, unknown>;
};

export async function getUnifiedFeed() {
  const items: FeedItem[] = [];

  const [thoughtsRes, gymRes] = await Promise.all([
    supabase
      .from('thoughts')
      .select('id, member_id, content, mood_tag, is_anonymous, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('gym_sessions')
      .select('id, member_id, mood, note, ended_at, started_at')
      .not('ended_at', 'is', null)
      .order('ended_at', { ascending: false })
      .limit(10),
  ]);

  const memberIds = new Set<string>();
  (thoughtsRes.data ?? []).forEach((t) => memberIds.add(t.member_id));
  (gymRes.data ?? []).forEach((g) => memberIds.add(g.member_id));

  const { data: members } = await supabase
    .from('members')
    .select('id, name, emoji')
    .in('id', Array.from(memberIds));

  const memberMap = new Map((members ?? []).map((m) => [m.id, m]));

  for (const t of thoughtsRes.data ?? []) {
    items.push({
      id: t.id,
      type: 'thought',
      created_at: t.created_at,
      author: t.is_anonymous ? undefined : memberMap.get(t.member_id) ?? undefined,
      content: t.content,
      payload: { mood_tag: t.mood_tag, anonymous: t.is_anonymous },
    });
  }

  const MOOD_INT_TO_EMOJI: Record<number, string> = {
    1: '💀',
    2: '😓',
    3: '😐',
    4: '💪',
    5: '🔥',
  };

  for (const g of gymRes.data ?? []) {
    items.push({
      id: g.id,
      type: 'gym',
      created_at: g.ended_at ?? g.started_at,
      author: memberMap.get(g.member_id),
      payload: {
        mood: g.mood ? MOOD_INT_TO_EMOJI[g.mood] : undefined,
        note: g.note,
      },
    });
  }

  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return items.slice(0, 30);
}
