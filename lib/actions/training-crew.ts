/**
 * Crew: lista membri con streak e PR count.
 * getCrewMembers: membri attivi con numero di PR (filtrato per type) e streak (placeholder 0).
 * Usato in /training/[type]/crew e nella sezione Crew di Progress.
 */
'use server';

import { supabase } from '@/lib/supabase';
import type { TrainingType } from '@/lib/actions/training';

export type CrewMemberWithStats = {
  id: string;
  name: string;
  emoji: string;
  streak: number;
  pr_count: number;
  sessions_count: number;
};

export async function getCrewMembers(type: TrainingType = 'gym'): Promise<CrewMemberWithStats[]> {
  const { data: members } = await supabase
    .from('members')
    .select('id, name, emoji')
    .eq('is_active', true);

  if (!members?.length) return [];

  const result = await Promise.all(
    members.map(async (m) => {
      const [prRes, sessionsRes] = await Promise.all([
        supabase
          .from('gym_prs')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', m.id)
          .eq('type', type),
        supabase
          .from('gym_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', m.id)
          .eq('type', type)
          .not('ended_at', 'is', null),
      ]);

      return {
        ...m,
        streak: 0,
        pr_count: prRes.count ?? 0,
        sessions_count: sessionsRes.count ?? 0,
      };
    })
  );

  return result;
}
