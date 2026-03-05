/**
 * Server Actions per Training (gym, tricking, calisthenics).
 * addGymSession: avvia una sessione workout.
 * addGymSet: aggiunge una serie (esercizio, kg, reps).
 * finishGymSession: chiude la sessione con mood e note.
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
  durationMinutes: number
): Promise<void> {
  const authSession = await getSession();
  if (!authSession) return;

  const moodInt = MOOD_EMOJI_TO_INT[moodEmoji] ?? 3;

  await supabase
    .from('gym_sessions')
    .update({
      ended_at: new Date().toISOString(),
      mood: moodInt,
      note: note || null,
      duration_minutes: durationMinutes,
    })
    .eq('id', sessionId)
    .eq('member_id', authSession.memberId);

  revalidatePath('/home');
  revalidatePath('/training');
}

/**
 * Crea una sessione gym/tricking/calisthenics in un colpo solo (log manuale, senza timer).
 * date = YYYY-MM-DD; started_at/ended_at derivati da date e durationMinutes.
 */
/** Parse reps string: "8" → [8,8,8,8] for 4 sets; "12-10-8-6" → [12,10,8,6] */
function parseReps(repsStr: string, setsCount: number): (number | null)[] {
  const trimmed = repsStr.trim();
  if (!trimmed) return Array(setsCount).fill(null);
  const parts = trimmed.split(/[-,\s]+/).map((p) => parseInt(p.trim(), 10)).filter((n) => !isNaN(n));
  if (parts.length === 0) return Array(setsCount).fill(null);
  if (parts.length === 1) return Array(setsCount).fill(parts[0]);
  const result: (number | null)[] = [];
  for (let i = 0; i < setsCount; i++) {
    result.push(parts[i] ?? parts[parts.length - 1] ?? null);
  }
  return result;
}

export async function createManualGymSession(
  type: 'gym' | 'tricking' | 'calisthenics',
  date: string,
  durationMinutes: number,
  moodEmoji: string,
  note: string,
  sets: { exercise: string; weight_kg: number | null; sets_count: number; reps: string }[]
): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const moodInt = MOOD_EMOJI_TO_INT[moodEmoji] ?? 3;
  const endedAt = new Date(date + 'T12:00:00.000Z');
  const startedAt = new Date(endedAt.getTime() - durationMinutes * 60 * 1000);

  const { data: inserted, error } = await supabase
    .from('gym_sessions')
    .insert({
      member_id: session.memberId,
      type,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_minutes: durationMinutes,
      mood: moodInt,
      note: note || null,
    })
    .select('id')
    .single();

  if (error || !inserted) {
    console.error('createManualGymSession', error);
    return;
  }

  const sessionId = inserted.id;
  let setNumber = 1;
  for (const s of sets) {
    if (!s.exercise.trim()) continue;
    const repsArr = parseReps(s.reps, s.sets_count);
    for (let i = 0; i < s.sets_count; i++) {
      await supabase.from('gym_sets').insert({
        session_id: sessionId,
        member_id: session.memberId,
        exercise_name: s.exercise.trim(),
        weight_kg: s.weight_kg,
        reps: repsArr[i] ?? null,
        set_number: setNumber++,
      });
    }
  }

  revalidatePath('/home');
  revalidatePath('/training');
}
