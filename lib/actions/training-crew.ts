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

  const memberIds = members.map((m) => m.id);

  const [prRes, sessionsRes] = await Promise.all([
    supabase
      .from('gym_prs')
      .select('member_id')
      .in('member_id', memberIds)
      .eq('type', type),
    supabase
      .from('gym_sessions')
      .select('member_id')
      .in('member_id', memberIds)
      .eq('type', type)
      .not('ended_at', 'is', null),
  ]);

  const prCountByMember = new Map<string, number>();
  const sessionsCountByMember = new Map<string, number>();
  for (const id of memberIds) {
    prCountByMember.set(id, 0);
    sessionsCountByMember.set(id, 0);
  }
  for (const row of prRes.data ?? []) {
    prCountByMember.set(row.member_id, (prCountByMember.get(row.member_id) ?? 0) + 1);
  }
  for (const row of sessionsRes.data ?? []) {
    sessionsCountByMember.set(row.member_id, (sessionsCountByMember.get(row.member_id) ?? 0) + 1);
  }

  return members.map((m) => ({
    ...m,
    streak: 0,
    pr_count: prCountByMember.get(m.id) ?? 0,
    sessions_count: sessionsCountByMember.get(m.id) ?? 0,
  }));
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

      const sessionIds = (sessions ?? []).map((s) => s.id);
      let setsBySession = new Map<string, { exercise_name: string; weight_kg: number | null; reps: number | null }[]>();

      if (sessionIds.length > 0) {
        const { data: allSets } = await supabase
          .from('gym_sets')
          .select('session_id, exercise_name, weight_kg, reps, set_number')
          .in('session_id', sessionIds)
          .order('set_number');

        for (const x of allSets ?? []) {
          const list = setsBySession.get(x.session_id) ?? [];
          list.push({
            exercise_name: x.exercise_name,
            weight_kg: x.weight_kg,
            reps: x.reps,
          });
          setsBySession.set(x.session_id, list);
        }
      }

      const sessionsWithSets: CrewSessionWithSets[] = (sessions ?? []).map((s) => ({
        id: s.id,
        started_at: s.started_at,
        ended_at: s.ended_at,
        duration_minutes: s.duration_minutes,
        mood: s.mood,
        sets: setsBySession.get(s.id) ?? [],
      }));

      return {
        ...m,
        sessions: sessionsWithSets,
        sessions_total: sessionsWithSets.length,
      };
    })
  );

  return result;
}
