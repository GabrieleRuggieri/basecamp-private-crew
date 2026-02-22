/**
 * Crew: lista membri con streak, PR count e sessioni.
 * getCrewMembers: membri attivi con stats (per Progress).
 * getCrewMembersWithSessions: membri con ultime N sessioni e set (per Crew page).
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

export type CrewSessionWithSets = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  mood: number | null;
  sets: { exercise_name: string; weight_kg: number | null; reps: number | null }[];
};

export type CrewMemberWithSessions = CrewMemberWithStats & {
  sessions: CrewSessionWithSets[];
  sessions_total: number;
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

export async function getCrewMembersWithSessions(
  type: TrainingType,
  maxSessionsPerMember = 10
): Promise<CrewMemberWithSessions[]> {
  const members = await getCrewMembers(type);
  if (members.length === 0) return [];

  const result = await Promise.all(
    members.map(async (m) => {
      const { data: sessions } = await supabase
        .from('gym_sessions')
        .select('id, started_at, ended_at, duration_minutes, mood')
        .eq('member_id', m.id)
        .eq('type', type)
        .not('ended_at', 'is', null)
        .order('ended_at', { ascending: false })
        .limit(maxSessionsPerMember);

      const sessionsWithSets: CrewSessionWithSets[] = [];
      for (const s of sessions ?? []) {
        const { data: sets } = await supabase
          .from('gym_sets')
          .select('exercise_name, weight_kg, reps')
          .eq('session_id', s.id)
          .order('set_number');

        sessionsWithSets.push({
          id: s.id,
          started_at: s.started_at,
          ended_at: s.ended_at,
          duration_minutes: s.duration_minutes,
          mood: s.mood,
          sets: (sets ?? []).map((x) => ({
            exercise_name: x.exercise_name,
            weight_kg: x.weight_kg,
            reps: x.reps,
          })),
        });
      }

      return {
        ...m,
        sessions: sessionsWithSets,
        sessions_total: sessionsWithSets.length,
      };
    })
  );

  return result;
}
