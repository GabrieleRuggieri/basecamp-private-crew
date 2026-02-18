/**
 * Server Actions per Gym.
 * addGymSession: avvia una sessione workout.
 * addGymSet: aggiunge una serie (esercizio, kg, reps).
 * finishGymSession: chiude la sessione con mood e note, controlla PR.
 * checkForPr: verifica se è un nuovo personal record.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export async function addGymSession(memberId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('gym_sessions')
    .insert({
      member_id: memberId,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('addGymSession', error);
    return null;
  }
  return data?.id ?? null;
}

export async function addGymSet(
  sessionId: string,
  memberId: string,
  exercise: string,
  weightKg: number | null,
  reps: number | null,
  setNumber: number
) {
  const { error } = await supabase.from('gym_sets').insert({
    session_id: sessionId,
    member_id: memberId,
    exercise_name: exercise,
    weight_kg: weightKg,
    reps,
    set_number: setNumber,
  });
  if (error) console.error('addGymSet', error);
}

const MOOD_EMOJI_TO_INT: Record<string, number> = {
  '💀': 1,
  '😓': 2,
  '😐': 3,
  '💪': 4,
  '🔥': 5,
};

export async function finishGymSession(
  sessionId: string,
  memberId: string,
  moodEmoji: string,
  note: string,
  durationMinutes: number
): Promise<{ exercise: string } | null> {
  const moodInt = MOOD_EMOJI_TO_INT[moodEmoji] ?? 3;

  const { data: session } = await supabase
    .from('gym_sessions')
    .update({
      ended_at: new Date().toISOString(),
      mood: moodInt,
      note: note || null,
      duration_minutes: durationMinutes,
    })
    .eq('id', sessionId)
    .select('member_id')
    .single();

  if (!session) return null;

  const { data: sets } = await supabase
    .from('gym_sets')
    .select('exercise_name, weight_kg, reps')
    .eq('session_id', sessionId)
    .not('weight_kg', 'is', null);

  let newPrExercise: string | null = null;

  for (const set of sets || []) {
    const isPr = await checkForPr(
      session.member_id,
      set.exercise_name,
      set.weight_kg,
      set.reps,
      sessionId
    );
    if (isPr) newPrExercise = set.exercise_name;
  }

  revalidatePath('/home');
  revalidatePath('/gym');
  return newPrExercise ? { exercise: newPrExercise } : null;
}

export async function checkForPr(
  memberId: string,
  exerciseName: string,
  weightKg: number,
  reps: number | null,
  sessionId: string
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('gym_prs')
    .select('weight_kg, reps')
    .eq('member_id', memberId)
    .eq('exercise_name', exerciseName)
    .single();

  if (!existing) {
    await supabase.from('gym_prs').insert({
      member_id: memberId,
      exercise_name: exerciseName,
      weight_kg: weightKg,
      reps,
      session_id: sessionId,
    });
    return true;
  }

  const isBetter =
    weightKg > (existing.weight_kg ?? 0) ||
    (weightKg === existing.weight_kg && (reps ?? 0) > (existing.reps ?? 0));

  if (isBetter) {
    await supabase
      .from('gym_prs')
      .update({
        weight_kg: weightKg,
        reps,
        achieved_at: new Date().toISOString(),
        session_id: sessionId,
      })
      .eq('member_id', memberId)
      .eq('exercise_name', exerciseName);
    return true;
  }

  return false;
}
