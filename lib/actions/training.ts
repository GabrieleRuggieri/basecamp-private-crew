/**
 * Server Actions per Training (gym, tricking, calisthenics).
 * addGymSession: avvia una sessione workout.
 * addGymSet: aggiunge una serie (esercizio, kg, reps).
 * finishGymSession: chiude la sessione con mood e note, controlla PR.
 * checkForPr: verifica se è un nuovo personal record.
 * memberId viene sempre letto da getSession() — mai accettato dal client.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/actions/auth';

export type TrainingType = 'gym' | 'tricking' | 'calisthenics' | 'running';

export async function addGymSession(
  type: TrainingType = 'gym'
): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('gym_sessions')
    .insert({
      member_id: session.memberId,
      type,
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

/** Annulla una sessione gym/tricking/calisthenics senza salvare (cancella dal DB). */
export async function cancelGymSession(sessionId: string): Promise<void> {
  const session = await getSession();
  if (!session) return;

  await supabase
    .from('gym_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('member_id', session.memberId)
    .in('type', ['gym', 'tricking', 'calisthenics']);

  revalidatePath('/training');
  revalidatePath('/home');
}

export async function addGymSet(
  sessionId: string,
  exercise: string,
  weightKg: number | null,
  reps: number | null,
  setNumber: number
) {
  const session = await getSession();
  if (!session) return;

  // Verify the session belongs to the authenticated member before inserting
  const { data: gymSession } = await supabase
    .from('gym_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('member_id', session.memberId)
    .single();

  if (!gymSession) return;

  const { error } = await supabase.from('gym_sets').insert({
    session_id: sessionId,
    member_id: session.memberId,
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
  moodEmoji: string,
  note: string,
  durationMinutes: number,
  prExercises: string[] = []
): Promise<{ exercise: string } | null> {
  const authSession = await getSession();
  if (!authSession) return null;

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
    .eq('member_id', authSession.memberId)
    .select('member_id, type')
    .single();

  if (!session) return null;

  const sessionType = (session.type ?? 'gym') as TrainingType;

  const { data: sets } = await supabase
    .from('gym_sets')
    .select('exercise_name, weight_kg, reps')
    .eq('session_id', sessionId);

  let newPrExercise: string | null = null;

  // PR manuali solo per gym: checkbox per esercizio
  if (sessionType === 'gym' && prExercises.length > 0 && sets?.length) {
    const byExercise = new Map<string, { weight_kg: number | null; reps: number | null }[]>();
    for (const s of sets) {
      const name = s.exercise_name?.trim();
      if (!name || !prExercises.includes(name)) continue;
      const arr = byExercise.get(name) ?? [];
      arr.push({ weight_kg: s.weight_kg, reps: s.reps });
      byExercise.set(name, arr);
    }
    for (const [ex, arr] of byExercise) {
      const best = arr.reduce((a, b) => {
        const aBetter =
          (a.weight_kg ?? 0) > (b.weight_kg ?? 0) ||
          ((a.weight_kg ?? 0) === (b.weight_kg ?? 0) && (a.reps ?? 0) > (b.reps ?? 0));
        return aBetter ? a : b;
      });
      const isPr = await checkForPr(
        session.member_id,
        ex,
        best.weight_kg ?? null,
        best.reps ?? null,
        sessionId,
        'gym'
      );
      if (isPr) newPrExercise = ex;
    }
  }

  // Calisthenics: PR automatici (nessuna checkbox)
  if (sessionType === 'calisthenics') {
    for (const set of sets || []) {
      const isPr = await checkForPr(
        session.member_id,
        set.exercise_name,
        set.weight_kg ?? null,
        set.reps ?? null,
        sessionId,
        'calisthenics'
      );
      if (isPr) newPrExercise = set.exercise_name;
    }
  }

  revalidatePath('/home');
  revalidatePath('/training');
  return newPrExercise ? { exercise: newPrExercise } : null;
}

export async function checkForPr(
  memberId: string,
  exerciseName: string,
  weightKg: number | null,
  reps: number | null,
  sessionId: string,
  type: TrainingType = 'gym'
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('gym_prs')
    .select('weight_kg, reps')
    .eq('member_id', memberId)
    .eq('exercise_name', exerciseName)
    .eq('type', type)
    .single();

  if (!existing) {
    await supabase.from('gym_prs').insert({
      member_id: memberId,
      exercise_name: exerciseName,
      type,
      weight_kg: weightKg,
      reps,
      session_id: sessionId,
    });
    return true;
  }

  // Tricking: solo mossa, nessun miglioramento numerico
  if (type === 'tricking') return false;

  const isBetter =
    (weightKg ?? 0) > (existing.weight_kg ?? 0) ||
    ((weightKg ?? 0) === (existing.weight_kg ?? 0) && (reps ?? 0) > (existing.reps ?? 0));

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
      .eq('exercise_name', exerciseName)
      .eq('type', type);
    return true;
  }

  return false;
}
