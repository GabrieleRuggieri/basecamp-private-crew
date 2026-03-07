/**
 * Progress: storico volume e crew.
 * getGymHistory: volume (kg×reps) per data, per grafico (filtrato per type).
 * getCrewProgress: lista crew con sessioni per type (per sezione Crew in Progress).
 * memberId viene sempre letto da getSession() — mai accettato dal client.
 */
'use server';

import { supabase } from '@/lib/supabase';
import type { TrainingType } from '@/lib/actions/training';
import { getCrewMembers } from '@/lib/actions/training-crew';

export type CrewProgressMember = {
  id: string;
  name: string;
  emoji: string;
  sessions_count: number;
};

export async function getCrewProgress(type: TrainingType): Promise<CrewProgressMember[]> {
  return getCrewMembers(type);
}

export async function getGymHistory(type: TrainingType = 'gym') {
  const { getSession } = await import('@/lib/actions/auth');
  const session = await getSession();
  if (!session) return { volumeByDate: [], sessions: [] };

  const { data: sessions } = await supabase
    .from('gym_sessions')
    .select('id, member_id, started_at, duration_minutes, mood, note')
    .eq('member_id', session.memberId)
    .eq('type', type)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: true });

  if (!sessions?.length) return { volumeByDate: [], sessions: [] };

  const sessionIds = sessions.map((s) => s.id);
  const { data: allSets } = await supabase
    .from('gym_sets')
    .select('session_id, exercise_name, weight_kg, reps, set_number')
    .in('session_id', sessionIds)
    .order('set_number');

  const setsBySession = new Map<string, { exercise_name: string; weight_kg: number | null; reps: number | null }[]>();
  for (const x of allSets ?? []) {
    if (x.exercise_name === 'running') continue;
    const list = setsBySession.get(x.session_id) ?? [];
    list.push({ exercise_name: x.exercise_name, weight_kg: x.weight_kg, reps: x.reps });
    setsBySession.set(x.session_id, list);
  }

  const volumeByDate: Record<string, number> = {};
  for (const s of sessions) {
    const date = s.started_at.slice(0, 10);
    const sets = setsBySession.get(s.id) ?? [];
    let volume = 0;
    for (const set of sets) {
      volume += (set.weight_kg ?? 0) * (set.reps ?? 0);
    }
    volumeByDate[date] = (volumeByDate[date] ?? 0) + volume;
  }

  const volumeData = Object.entries(volumeByDate)
    .map(([date, volume]) => ({ date, volume }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const sessionsList = sessions
    .map((s) => ({
      id: s.id,
      member_id: s.member_id,
      date: s.started_at.slice(0, 10),
      duration_minutes: s.duration_minutes ?? 0,
      started_at: s.started_at,
      mood: s.mood,
      note: s.note ?? null,
      sets: setsBySession.get(s.id) ?? [],
    }))
    .sort((a, b) => b.started_at.localeCompare(a.started_at));

  return { volumeByDate: volumeData, sessions: sessionsList };
}
