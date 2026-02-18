/**
 * Progress Gym: PR e storico volume.
 * getGymPrs: personal records del membro ordinati per peso.
 * getGymHistory: volume (kg×reps) per data, per grafico.
 */
'use server';

import { supabase } from '@/lib/supabase';

export async function getGymPrs(memberId: string) {
  const { data } = await supabase
    .from('gym_prs')
    .select('exercise_name, weight_kg, reps')
    .eq('member_id', memberId)
    .order('weight_kg', { ascending: false });

  return (data ?? []).map((r) => ({
    exercise: r.exercise_name,
    weight_kg: r.weight_kg,
    reps: r.reps,
  }));
}

export async function getGymHistory(memberId: string) {
  const { data: sessions } = await supabase
    .from('gym_sessions')
    .select('id, started_at')
    .eq('member_id', memberId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: true });

  if (!sessions?.length) return [];

  const result: { date: string; volume: number }[] = [];
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

  return Object.entries(volumeByDate)
    .map(([date, volume]) => ({ date, volume }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
