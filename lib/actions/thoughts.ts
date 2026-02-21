/**
 * Server Actions per Thoughts (pensieri).
 * getThoughts: lista pensieri con autore e tags, opzionale filtro per tag.
 * addThought: crea pensiero con tags (side_quest, riflessione, proposta).
 */
'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export type ThoughtTag = 'side_quest' | 'riflessione' | 'proposta';

export async function getThoughts(filterTag?: ThoughtTag | null) {
  const { data: thoughts } = await supabase
    .from('thoughts')
    .select('id, member_id, content, mood_tag, is_anonymous, created_at')
    .order('created_at', { ascending: false });

  if (!thoughts?.length) return [];

  const thoughtIds = thoughts.map((t) => t.id);
  const { data: tagsRows } = await supabase
    .from('thought_tags')
    .select('thought_id, tag')
    .in('thought_id', thoughtIds);

  const tagsByThought = new Map<string, ThoughtTag[]>();
  for (const row of tagsRows ?? []) {
    const list = tagsByThought.get(row.thought_id) ?? [];
    list.push(row.tag as ThoughtTag);
    tagsByThought.set(row.thought_id, list);
  }

  let filtered = thoughts;
  if (filterTag) {
    filtered = thoughts.filter((t) =>
      (tagsByThought.get(t.id) ?? []).includes(filterTag)
    );
  }

  const memberIds = Array.from(new Set(filtered.map((t) => t.member_id)));
  const { data: members } = await supabase
    .from('members')
    .select('id, name, emoji')
    .in('id', memberIds);

  const memberMap = new Map((members ?? []).map((m) => [m.id, m]));

  return filtered.map((t) => ({
    ...t,
    anonymous: t.is_anonymous,
    author: t.is_anonymous ? null : memberMap.get(t.member_id) ?? null,
    tags: tagsByThought.get(t.id) ?? [],
  }));
}

export async function addThought(
  memberId: string,
  content: string,
  tags: ThoughtTag[],
  anonymous: boolean
) {
  const { data: thought, error: thoughtError } = await supabase
    .from('thoughts')
    .insert({
      member_id: memberId,
      content,
      is_anonymous: anonymous,
    })
    .select('id')
    .single();

  if (thoughtError || !thought) {
    console.error('addThought', thoughtError);
    return;
  }

  if (tags.length > 0) {
    await supabase.from('thought_tags').insert(
      tags.map((tag) => ({ thought_id: thought.id, tag }))
    );
  }

  revalidatePath('/thoughts');
  revalidatePath('/home');
}
