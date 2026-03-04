/**
 * Server Actions per Running.
 * addRunningSession: avvia una sessione di corsa.
 * finishRunningSession: chiude la sessione con km, pace, mood e note.
 *   Salva un gym_set con km_distance e pace_min_km, aggiorna best km e best pace in gym_prs.
 * getRunningHistory: storico sessioni con km e pace per il grafico.
 * memberId viene sempre letto da getSession() — mai accettato dal client.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/actions/auth';

const MOOD_EMOJI_TO_INT: Record<string, number> = {
  '💀': 1,
  '😓': 2,
  '😐': 3,
  '💪': 4,
  '🔥': 5,
};

export type RunningSessionEntry = {
  id: string;
  date: string;
  started_at: string;
  duration_minutes: number;
  km: number;
  pace_min_km: number;
};

export async function addRunningSession(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('gym_sessions')
    .insert({
      member_id: session.memberId,
      type: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('addRunningSession', error);
    return null;
  }
  return data?.id ?? null;
}

/** Annulla una sessione running senza salvare (cancella dal DB). */
export async function cancelRunningSession(sessionId: string): Promise<void> {
  const session = await getSession();
  if (!session) return;

  await supabase
    .from('gym_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('member_id', session.memberId)
    .eq('type', 'running');

  revalidatePath('/training');
  revalidatePath('/training/running');
}

export async function finishRunningSession(
  sessionId: string,
  kmDistance: number,
  paceMinKm: number,
  moodEmoji: string,
  note: string,
  durationMinutes: number
): Promise<void> {
  const authSession = await getSession();
  if (!authSession) return;

  const moodInt = MOOD_EMOJI_TO_INT[moodEmoji] ?? 3;

  const { data: gymSession } = await supabase
    .from('gym_sessions')
    .update({
      ended_at: new Date().toISOString(),
      mood: moodInt,
      note: note || null,
      duration_minutes: durationMinutes,
    })
    .eq('id', sessionId)
    .eq('member_id', authSession.memberId)
    .select('id')
    .single();

  if (!gymSession) return;

  await supabase.from('gym_sets').insert({
    session_id: sessionId,
    member_id: authSession.memberId,
    exercise_name: 'running',
    km_distance: kmDistance,
    pace_min_km: paceMinKm,
    set_number: 1,
  });

  await updateRunningBests(authSession.memberId, kmDistance, paceMinKm, sessionId);

  revalidatePath('/home');
  revalidatePath('/training');
  revalidatePath('/training/running');
}

async function updateRunningBests(
  memberId: string,
  km: number,
  pace: number,
  sessionId: string
) {
  // Best km
  const { data: bestKm } = await supabase
    .from('gym_prs')
    .select('weight_kg')
    .eq('member_id', memberId)
    .eq('exercise_name', 'best_km')
    .eq('type', 'running')
    .single();

  if (!bestKm) {
    await supabase.from('gym_prs').insert({
      member_id: memberId,
      exercise_name: 'best_km',
      type: 'running',
      weight_kg: km,
      session_id: sessionId,
    });
  } else if (km > (bestKm.weight_kg ?? 0)) {
    await supabase
      .from('gym_prs')
      .update({ weight_kg: km, achieved_at: new Date().toISOString(), session_id: sessionId })
      .eq('member_id', memberId)
      .eq('exercise_name', 'best_km')
      .eq('type', 'running');
  }

  // Best pace: valore più basso = migliore (meno minuti per km)
  const { data: bestPace } = await supabase
    .from('gym_prs')
    .select('weight_kg')
    .eq('member_id', memberId)
    .eq('exercise_name', 'best_pace')
    .eq('type', 'running')
    .single();

  if (!bestPace) {
    await supabase.from('gym_prs').insert({
      member_id: memberId,
      exercise_name: 'best_pace',
      type: 'running',
      weight_kg: pace,
      session_id: sessionId,
    });
  } else if (pace < (bestPace.weight_kg ?? Infinity)) {
    await supabase
      .from('gym_prs')
      .update({ weight_kg: pace, achieved_at: new Date().toISOString(), session_id: sessionId })
      .eq('member_id', memberId)
      .eq('exercise_name', 'best_pace')
      .eq('type', 'running');
  }
}

export async function getRunningHistory(): Promise<{
  sessions: RunningSessionEntry[];
  bestKm: number | null;
  bestPace: number | null;
}> {
  const session = await getSession();
  if (!session) return { sessions: [], bestKm: null, bestPace: null };

  const { data: gymSessions } = await supabase
    .from('gym_sessions')
    .select('id, started_at, duration_minutes')
    .eq('member_id', session.memberId)
    .eq('type', 'running')
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false });

  if (!gymSessions?.length) return { sessions: [], bestKm: null, bestPace: null };

  const sessionIds = gymSessions.map((s) => s.id);
  const { data: sets } = await supabase
    .from('gym_sets')
    .select('session_id, km_distance, pace_min_km')
    .in('session_id', sessionIds)
    .eq('exercise_name', 'running');

  const setBySession = new Map(
    (sets ?? []).map((s) => [s.session_id, { km: s.km_distance, pace: s.pace_min_km }])
  );

  const sessions: RunningSessionEntry[] = gymSessions
    .map((s) => {
      const data = setBySession.get(s.id);
      if (!data?.km) return null;
      return {
        id: s.id,
        date: s.started_at.slice(0, 10),
        started_at: s.started_at,
        duration_minutes: s.duration_minutes ?? 0,
        km: data.km,
        pace_min_km: data.pace ?? 0,
      };
    })
    .filter((s): s is RunningSessionEntry => s !== null);

  const { data: prs } = await supabase
    .from('gym_prs')
    .select('exercise_name, weight_kg')
    .eq('member_id', session.memberId)
    .eq('type', 'running')
    .in('exercise_name', ['best_km', 'best_pace']);

  const bestKm = prs?.find((p) => p.exercise_name === 'best_km')?.weight_kg ?? null;
  const bestPace = prs?.find((p) => p.exercise_name === 'best_pace')?.weight_kg ?? null;

  return { sessions, bestKm, bestPace };
}
