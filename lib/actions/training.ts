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

/** Modifica una sessione completata (solo il creatore). Aggiorna mood, note, duration e set. */
export async function updateGymSession(
  sessionId: string,
  moodEmoji: string,
  note: string,
  durationMinutes: number,
  sets: { exercise: string; weight_kg: number | null; sets_count: number; reps: string }[]
): Promise<{ ok: boolean; error?: string }> {
  const authSession = await getSession();
  if (!authSession) return { ok: false, error: 'Not authenticated' };

  const moodInt = MOOD_EMOJI_TO_INT[moodEmoji] ?? 3;

  const { data: existing } = await supabase
    .from('gym_sessions')
    .select('id, member_id, type')
    .eq('id', sessionId)
    .single();

  if (!existing || existing.member_id !== authSession.memberId) {
    return { ok: false, error: 'Not authorized' };
  }
  if (existing.type === 'running') {
    return { ok: false, error: 'Use updateRunningSession for running' };
  }

  const { error: updateError } = await supabase
    .from('gym_sessions')
    .update({
      mood: moodInt,
      note: note || null,
      duration_minutes: durationMinutes,
    })
    .eq('id', sessionId)
    .eq('member_id', authSession.memberId);

  if (updateError) {
    console.error('updateGymSession', updateError);
    return { ok: false, error: updateError.message };
  }

  await supabase.from('gym_sets').delete().eq('session_id', sessionId);

  const setsToInsert = sets
    .filter((s) => s.exercise.trim())
    .flatMap((s) => {
      const repsArr = parseReps(s.reps, s.sets_count);
      return Array.from({ length: s.sets_count }, (_, i) => ({
        session_id: sessionId,
        member_id: authSession.memberId,
        exercise_name: s.exercise.trim(),
        weight_kg: s.weight_kg,
        reps: repsArr[i] ?? null,
        set_number: 0,
      }));
    })
    .map((s, i) => ({ ...s, set_number: i + 1 }));

  if (setsToInsert.length > 0) {
    const { error: insertError } = await supabase.from('gym_sets').insert(setsToInsert);
    if (insertError) {
      console.error('updateGymSession sets', insertError);
      return { ok: false, error: insertError.message };
    }
  }

  revalidatePath('/home');
  revalidatePath('/training');
  return { ok: true };
}

/** Recupera una sessione gym/tricking/calisthenics per modifica. */
export async function getGymSessionForEdit(sessionId: string) {
  const authSession = await getSession();
  if (!authSession) return null;

  const { data: gymSession } = await supabase
    .from('gym_sessions')
    .select('id, member_id, type, started_at, ended_at, duration_minutes, mood, note')
    .eq('id', sessionId)
    .eq('member_id', authSession.memberId)
    .single();

  if (!gymSession || !gymSession.ended_at) return null;

  const MOOD_INT_TO_EMOJI: Record<number, string> = {
    1: '💀',
    2: '😓',
    3: '😐',
    4: '💪',
    5: '🔥',
  };

  const { data: gymSets } = await supabase
    .from('gym_sets')
    .select('exercise_name, weight_kg, reps, set_number')
    .eq('session_id', sessionId)
    .neq('exercise_name', 'running')
    .order('set_number');

  const setsGrouped = (gymSets ?? []).reduce(
    (acc, s) => {
      const key = s.exercise_name;
      if (!acc[key]) acc[key] = { weight_kg: s.weight_kg, reps: [] as (number | null)[] };
      acc[key].reps.push(s.reps);
      return acc;
    },
    {} as Record<string, { weight_kg: number | null; reps: (number | null)[] }>
  );

  const sets = Object.entries(setsGrouped).map(([exercise, { weight_kg, reps }]) => {
    const repsStr = reps.every((r) => r === reps[0]) ? String(reps[0] ?? '') : reps.join('-');
    return {
      exercise,
      weight_kg,
      sets_count: reps.length,
      reps: repsStr,
    };
  });

  return {
    id: gymSession.id,
    type: gymSession.type as 'gym' | 'tricking' | 'calisthenics',
    date: gymSession.started_at.slice(0, 10),
    duration_minutes: gymSession.duration_minutes ?? 0,
    mood: MOOD_INT_TO_EMOJI[gymSession.mood ?? 3] ?? '😐',
    note: gymSession.note ?? '',
    sets,
  };
}
