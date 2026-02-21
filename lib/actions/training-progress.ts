/**
 * Progress: PR e storico volume.
 * getGymPrs: personal records del membro ordinati per peso (filtrati per type).
 * getGymHistory: volume (kg×reps) per data, per grafico (filtrato per type).
 * getCrewProgress: lista crew con PR e sessioni per type (per sezione Crew in Progress).
 */
'use server';

import { supabase } from '@/lib/supabase';
import type { TrainingType } from '@/lib/actions/training';
import { getCrewMembers } from '@/lib/actions/training-crew';

export type CrewProgressMember = {
  id: string;
  name: string;
  emoji: string;
  pr_count: number;
  sessions_count: number;
  prs: { exercise: string; weight_kg: number | null; reps: number | null }[];
};

export async function getCrewProgress(type: TrainingType): Promise<CrewProgressMember[]> {
  const crew = await getCrewMembers(type);
  if (crew.length === 0) return [];

  const result = await Promise.all(
    crew.map(async (m) => {
      const { data: prs } = await supabase
        .from('gym_prs')
        .select('exercise_name, weight_kg, reps')
        .eq('member_id', m.id)
        .eq('type', type)
        .order('achieved_at', { ascending: false });

      return {
        id: m.id,
        name: m.name,
        emoji: m.emoji,
        pr_count: m.pr_count,
        sessions_count: m.sessions_count,
        prs: (prs ?? []).map((r) => ({
          exercise: r.exercise_name,
          weight_kg: r.weight_kg,
          reps: r.reps,
        })),
      };
    })
  );

  return result;
}

export async function getGymPrs(memberId: string, type: TrainingType = 'gym') {
  const { data } = await supabase
    .from('gym_prs')
    .select('exercise_name, weight_kg, reps')
    .eq('member_id', memberId)
    .eq('type', type)
    .order('achieved_at', { ascending: false });

  return (data ?? []).map((r) => ({
    exercise: r.exercise_name,
    weight_kg: r.weight_kg,
    reps: r.reps,
  }));
}

export async function getGymHistory(memberId: string, type: TrainingType = 'gym') {
  const { data: sessions } = await supabase
    .from('gym_sessions')
    .select('id, started_at, duration_minutes')
    .eq('member_id', memberId)
    .eq('type', type)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: true });

  if (!sessions?.length) return { volumeByDate: [], sessions: [] };

  const volumeByDate: Record<string, number> = {};

  for (const s of sessions) {
    const date = s.started_at.slice(0, 10);
    const { data: sets } = await supabase
      .from('gym_sets')
      .select('weight_kg, reps')
      .eq('session_id', s.id);

    let volume = 0;
    for (const set of sets ?? []) {
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
      date: s.started_at.slice(0, 10),
      duration_minutes: s.duration_minutes ?? 0,
      started_at: s.started_at,
    }))
    .sort((a, b) => b.started_at.localeCompare(a.started_at));

  return { volumeByDate: volumeData, sessions: sessionsList };
}
