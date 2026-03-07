/**
 * Crew: lista membri con sessioni.
 * getCrewMembers: membri attivi con session count (per Progress).
 * getCrewMembersWithSessions: membri con ultime N sessioni e set (per Crew page).
 */
'use server';

import { supabase } from '@/lib/supabase';
import type { TrainingType } from '@/lib/actions/training';

export type CrewMemberWithStats = {
  id: string;
  name: string;
  emoji: string;
  sessions_count: number;
};

export type CrewSessionWithSets = {
  id: string;
  member_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  mood: number | null;
  note: string | null;
  sets: { exercise_name: string; weight_kg: number | null; reps: number | null; km_distance?: number | null; pace_min_km?: number | null }[];
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

  const { data: sessionsRes } = await supabase
    .from('gym_sessions')
    .select('member_id')
    .in('member_id', memberIds)
    .eq('type', type)
    .not('ended_at', 'is', null);

  const sessionsCountByMember = new Map<string, number>();
  for (const id of memberIds) sessionsCountByMember.set(id, 0);
  for (const row of sessionsRes ?? []) {
    sessionsCountByMember.set(row.member_id, (sessionsCountByMember.get(row.member_id) ?? 0) + 1);
  }

  return members.map((m) => ({
    ...m,
    sessions_count: sessionsCountByMember.get(m.id) ?? 0,
  }));
}

export async function getCrewMembersWithSessions(
  type: TrainingType,
  maxSessionsPerMember = 10
): Promise<CrewMemberWithSessions[]> {
  const members = await getCrewMembers(type);
  if (members.length === 0) return [];

  const memberIds = members.map((m) => m.id);

  const { data: allSessions } = await supabase
    .from('gym_sessions')
    .select('id, member_id, started_at, ended_at, duration_minutes, mood, note')
    .in('member_id', memberIds)
    .eq('type', type)
    .not('ended_at', 'is', null)
    .order('ended_at', { ascending: false });

  // Keep only the most recent maxSessionsPerMember sessions per member
  const sessionsByMember = new Map<string, typeof allSessions>(memberIds.map((id) => [id, []]));
  for (const s of allSessions ?? []) {
    const list = sessionsByMember.get(s.member_id) ?? [];
    if (list.length < maxSessionsPerMember) {
      list.push(s);
      sessionsByMember.set(s.member_id, list);
    }
  }

  const keptSessionIds = [...sessionsByMember.values()].flat().map((s) => s!.id);

  const setsBySession = new Map<string, { exercise_name: string; weight_kg: number | null; reps: number | null; km_distance?: number | null; pace_min_km?: number | null }[]>();

  if (keptSessionIds.length > 0) {
    const { data: allSets } = await supabase
      .from('gym_sets')
      .select('session_id, exercise_name, weight_kg, reps, set_number, km_distance, pace_min_km')
      .in('session_id', keptSessionIds)
      .order('set_number');

    for (const x of allSets ?? []) {
      const list = setsBySession.get(x.session_id) ?? [];
      list.push({
        exercise_name: x.exercise_name,
        weight_kg: x.weight_kg,
        reps: x.reps,
        km_distance: x.km_distance ?? null,
        pace_min_km: x.pace_min_km ?? null,
      });
      setsBySession.set(x.session_id, list);
    }
  }

  return members.map((m) => {
    const sessions = (sessionsByMember.get(m.id) ?? []).map((s) => ({
      id: s!.id,
      member_id: s!.member_id,
      started_at: s!.started_at,
      ended_at: s!.ended_at,
      duration_minutes: s!.duration_minutes,
      mood: s!.mood,
      note: s!.note ?? null,
      sets: setsBySession.get(s!.id) ?? [],
    })) as CrewSessionWithSets[];

    return {
      ...m,
      sessions,
      sessions_total: sessions.length,
    };
  });
}
