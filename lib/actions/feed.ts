/**
 * Feed unificato per la Home.
 * getUnifiedFeed: unisce thoughts, gym_sessions, travels, watchlist, moments per sezione.
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

const MOOD_INT_TO_EMOJI: Record<number, string> = {
  1: '💀',
  2: '😓',
  3: '😐',
  4: '💪',
  5: '🔥',
};

const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 365;

export async function getUnifiedFeed() {
  const [
    thoughtsRes,
    gymRes,
    travelsRes,
    watchlistRes,
  ] = await Promise.all([
    supabase
      .from('thoughts')
      .select('id, member_id, content, is_anonymous, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('gym_sessions')
      .select('id, member_id, mood, note, ended_at, started_at, type')
      .not('ended_at', 'is', null)
      .order('ended_at', { ascending: false })
      .limit(10),
    supabase
      .from('travels')
      .select('id, member_id, title, location, country_emoji, status, year, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('watchlist')
      .select('id, member_id, title, type, status, added_at')
      .order('added_at', { ascending: false })
      .limit(10),
  ]);

  const [albumsRes, singlesRes] = await Promise.all([
    supabase
      .from('moment_albums')
      .select('id, member_id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('moments')
      .select('id, member_id, storage_path, caption, taken_at')
      .is('album_id', null)
      .order('taken_at', { ascending: false })
      .limit(20),
  ]);

  const memberIds = new Set<string>();
  (thoughtsRes.data ?? []).forEach((t) => memberIds.add(t.member_id));
  (gymRes.data ?? []).forEach((g) => memberIds.add(g.member_id));
  (travelsRes.data ?? []).forEach((t) => memberIds.add(t.member_id));
  (watchlistRes.data ?? []).forEach((w) => memberIds.add(w.member_id));
  (albumsRes.data ?? []).forEach((a) => memberIds.add(a.member_id));
  (singlesRes.data ?? []).forEach((m) => memberIds.add(m.member_id));

  const { data: members } = await supabase
    .from('members')
    .select('id, name, emoji')
    .in('id', Array.from(memberIds));

  const memberMap = new Map((members ?? []).map((m) => [m.id, m]));

  const thoughtIds = (thoughtsRes.data ?? []).map((t) => t.id);
  const { data: thoughtTags } =
    thoughtIds.length > 0
      ? await supabase.from('thought_tags').select('thought_id, tag').in('thought_id', thoughtIds)
      : { data: null };

  const tagsByThought = new Map<string, string[]>();
  for (const row of thoughtTags ?? []) {
    const list = tagsByThought.get(row.thought_id) ?? [];
    list.push(row.tag);
    tagsByThought.set(row.thought_id, list);
  }

  const thoughts: FeedItem[] = (thoughtsRes.data ?? []).map((t) => ({
    id: t.id,
    type: 'thought',
    created_at: t.created_at,
    author: t.is_anonymous ? undefined : memberMap.get(t.member_id) ?? undefined,
    content: t.content,
    payload: {
      tags: tagsByThought.get(t.id) ?? [],
      anonymous: t.is_anonymous,
    },
  }));

  const training: FeedItem[] = (gymRes.data ?? []).map((g) => ({
    id: g.id,
    type: 'gym',
    created_at: g.ended_at ?? g.started_at,
    author: memberMap.get(g.member_id),
    payload: {
      mood: g.mood ? MOOD_INT_TO_EMOJI[g.mood] : undefined,
      note: g.note,
      trainingType: g.type ?? 'gym',
    },
  }));

  const travels: FeedItem[] = (travelsRes.data ?? []).map((t) => ({
    id: t.id,
    type: 'travel',
    created_at: t.created_at,
    author: memberMap.get(t.member_id),
    content: t.title,
    payload: {
      location: t.location,
      country_emoji: t.country_emoji,
      status: t.status,
      year: t.year,
    },
  }));

  const watchlist: FeedItem[] = (watchlistRes.data ?? []).map((w) => ({
    id: w.id,
    type: 'watchlist',
    created_at: w.added_at,
    author: memberMap.get(w.member_id),
    content: w.title,
    payload: {
      type: w.type,
      status: w.status,
    },
  }));

  const albumIds = (albumsRes.data ?? []).map((a) => a.id);
  let firstByAlbum = new Map<string, { id: string; storage_path: string }>();
  let albumCounts = new Map<string, number>();

  if (albumIds.length > 0) {
    const { data: albumMoments } = await supabase
      .from('moments')
      .select('id, storage_path, album_id, position')
      .in('album_id', albumIds);

    for (const aId of albumIds) {
      const momentsOfAlbum = (albumMoments ?? [])
        .filter((m) => m.album_id === aId)
        .sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
      if (momentsOfAlbum.length > 0) {
        firstByAlbum.set(aId, {
          id: momentsOfAlbum[0].id,
          storage_path: momentsOfAlbum[0].storage_path,
        });
        albumCounts.set(aId, momentsOfAlbum.length);
      }
    }
  }

  const momentItems: { type: 'album' | 'single'; created_at: string; data: unknown }[] = [];
  for (const a of albumsRes.data ?? []) {
    momentItems.push({ type: 'album', created_at: a.created_at, data: a });
  }
  for (const m of singlesRes.data ?? []) {
    momentItems.push({ type: 'single', created_at: m.taken_at, data: m });
  }
  momentItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const moments: FeedItem[] = [];
  for (const item of momentItems.slice(0, 10)) {
    if (item.type === 'album') {
      const a = item.data as { id: string; member_id: string; title: string | null; created_at: string };
      const first = firstByAlbum.get(a.id);
      const imageUrl = first
        ? (await supabase.storage.from('moments').createSignedUrl(first.storage_path, SIGNED_URL_EXPIRY)).data
            ?.signedUrl ?? null
        : null;
      const count = albumCounts.get(a.id) ?? 0;
      moments.push({
        id: a.id,
        type: 'moment',
        created_at: a.created_at,
        author: memberMap.get(a.member_id),
        content: a.title ?? undefined,
        payload: { imageUrl, isAlbum: true, count },
      });
    } else {
      const m = item.data as { id: string; member_id: string; storage_path: string; caption: string | null; taken_at: string };
      const { data: signed } = await supabase.storage
        .from('moments')
        .createSignedUrl(m.storage_path, SIGNED_URL_EXPIRY);
      moments.push({
        id: m.id,
        type: 'moment',
        created_at: m.taken_at,
        author: memberMap.get(m.member_id),
        content: m.caption ?? undefined,
        payload: { imageUrl: signed?.signedUrl ?? null },
      });
    }
  }

  return { thoughts, training, travels, watchlist, moments };
}

export type FeedBySections = Awaited<ReturnType<typeof getUnifiedFeed>>;
