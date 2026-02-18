/**
 * Crew Gym: lista membri con streak e PR count.
 * getCrewMembers: membri attivi con numero di PR e streak (placeholder 0).
 * Usato in /gym/crew.
 */
'use server';

import { supabase } from '@/lib/supabase';

export async function getCrewMembers() {
  const { data: members } = await supabase
    .from('members')
    .select('id, name, emoji')
    .eq('is_active', true);

  if (!members?.length) return [];

  const result = await Promise.all(
    members.map(async (m) => {
      const { count: prCount } = await supabase
        .from('gym_prs')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', m.id);

      return {
        ...m,
        streak: 0,
        pr_count: prCount ?? 0,
      };
    })
  );

  return result;
}
