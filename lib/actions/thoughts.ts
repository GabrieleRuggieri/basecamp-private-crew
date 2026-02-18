/**
 * Server Actions per Thoughts (pensieri).
 * getThoughts: lista tutti i pensieri con autore (o anonimo).
 * addThought: crea un nuovo pensiero, revalida /thoughts e /home.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export async function getThoughts() {
  const { data: thoughts } = await supabase
    .from('thoughts')
    .select('id, member_id, content, mood_tag, is_anonymous, created_at')
    .order('created_at', { ascending: false });

  if (!thoughts?.length) return [];

  const memberIds = Array.from(new Set(thoughts.map((t) => t.member_id)));
  const { data: members } = await supabase
    .from('members')
    .select('id, name, emoji')
    .in('id', memberIds);

  const memberMap = new Map((members ?? []).map((m) => [m.id, m]));

  return thoughts.map((t) => ({
    ...t,
    anonymous: t.is_anonymous,
    author: t.is_anonymous ? null : memberMap.get(t.member_id) ?? null,
  }));
}

export async function addThought(
  memberId: string,
  content: string,
  moodTag: string | null,
  anonymous: boolean
) {
  const { error } = await supabase.from('thoughts').insert({
    member_id: memberId,
    content,
    mood_tag: moodTag,
    is_anonymous: anonymous,
  });
  if (error) console.error('addThought', error);
  else {
    revalidatePath('/thoughts');
    revalidatePath('/home');
  }
}
