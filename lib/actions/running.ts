/**
 * Server Actions per Running.
 * addRunningSession: avvia una sessione di corsa.
 * finishRunningSession: chiude la sessione con km, pace, mood e note (salva gym_set con km e pace).
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
  mood: number | null;
  note: string | null;
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

/**
 * Crea una sessione running in un colpo solo (log manuale, senza timer).
 * date = YYYY-MM-DD; pace derivato da durationMinutes e km.
 */
export async function createManualRunningSession(
  date: string,
  durationMinutes: number,
  km: number,
  moodEmoji: string,
  note: string
): Promise<void> {
  const session = await getSession();
  if (!session) return;

  if (km <= 0 || durationMinutes <= 0) return;
  const paceMinKm = durationMinutes / km;
  const moodInt = MOOD_EMOJI_TO_INT[moodEmoji] ?? 3;
  const endedAt = new Date(date + 'T12:00:00.000Z');
  const startedAt = new Date(endedAt.getTime() - durationMinutes * 60 * 1000);

  const { data: inserted, error } = await supabase
    .from('gym_sessions')
    .insert({
      member_id: session.memberId,
      type: 'running',
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_minutes: durationMinutes,
      mood: moodInt,
      note: note || null,
    })
    .select('id')
    .single();

  if (error || !inserted) {
    console.error('createManualRunningSession', error);
    return;
  }

  await supabase.from('gym_sets').insert({
    session_id: inserted.id,
    member_id: session.memberId,
    exercise_name: 'running',
    km_distance: km,
    pace_min_km: paceMinKm,
    set_number: 1,
  });

  revalidatePath('/home');
  revalidatePath('/training');
  revalidatePath('/training/running');
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

  revalidatePath('/home');
  revalidatePath('/training');
  revalidatePath('/training/running');
}

export async function getRunningHistory(): Promise<{
  sessions: RunningSessionEntry[];
}> {
  const session = await getSession();
  if (!session) return { sessions: [] };

  const { data: gymSessions } = await supabase
    .from('gym_sessions')
    .select('id, started_at, duration_minutes, mood, note')
    .eq('member_id', session.memberId)
    .eq('type', 'running')
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false });

  if (!gymSessions?.length) return { sessions: [] };

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
        mood: s.mood ?? null,
        note: s.note ?? null,
      };
    })
    .filter((s): s is RunningSessionEntry => s !== null);

  return { sessions };
}

/** Modifica una sessione running completata (solo il creatore). */
export async function updateRunningSession(
  sessionId: string,
  date: string,
  durationMinutes: number,
  km: number,
  moodEmoji: string,
  note: string
): Promise<{ ok: boolean; error?: string }> {
  const authSession = await getSession();
  if (!authSession) return { ok: false, error: 'Not authenticated' };

  const { data: existing } = await supabase
    .from('gym_sessions')
    .select('id, member_id')
    .eq('id', sessionId)
    .eq('member_id', authSession.memberId)
    .single();

  if (!existing) return { ok: false, error: 'Not authorized' };

  const paceMinKm = durationMinutes / km;
  const moodInt = MOOD_EMOJI_TO_INT[moodEmoji] ?? 3;
  const endedAt = new Date(date + 'T12:00:00.000Z');
  const startedAt = new Date(endedAt.getTime() - durationMinutes * 60 * 1000);

  const { error: updateError } = await supabase
    .from('gym_sessions')
    .update({
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_minutes: durationMinutes,
      mood: moodInt,
      note: note || null,
    })
    .eq('id', sessionId)
    .eq('member_id', authSession.memberId);

  if (updateError) {
    console.error('updateRunningSession', updateError);
    return { ok: false, error: updateError.message };
  }

  const { data: existingSet } = await supabase
    .from('gym_sets')
    .select('id')
    .eq('session_id', sessionId)
    .eq('exercise_name', 'running')
    .single();

  if (existingSet) {
    await supabase
      .from('gym_sets')
      .update({ km_distance: km, pace_min_km: paceMinKm })
      .eq('session_id', sessionId)
      .eq('exercise_name', 'running');
  }

  revalidatePath('/home');
  revalidatePath('/training');
  revalidatePath('/training/running');
  return { ok: true };
}

/** Recupera una sessione running per modifica. */
export async function getRunningSessionForEdit(sessionId: string) {
  const authSession = await getSession();
  if (!authSession) return null;

  const { data: gymSession } = await supabase
    .from('gym_sessions')
    .select('id, started_at, duration_minutes, mood, note')
    .eq('id', sessionId)
    .eq('member_id', authSession.memberId)
    .eq('type', 'running')
    .single();

  if (!gymSession || !gymSession.duration_minutes) return null;

  const { data: gymSet } = await supabase
    .from('gym_sets')
    .select('km_distance')
    .eq('session_id', sessionId)
    .eq('exercise_name', 'running')
    .single();

  const MOOD_INT_TO_EMOJI: Record<number, string> = {
    1: '💀',
    2: '😓',
    3: '😐',
    4: '💪',
    5: '🔥',
  };

  return {
    id: sessionId,
    date: gymSession.started_at.slice(0, 10),
    duration_minutes: gymSession.duration_minutes,
    km: gymSet?.km_distance ?? 0,
    mood: MOOD_INT_TO_EMOJI[gymSession.mood ?? 3] ?? '😐',
    note: gymSession.note ?? '',
  };
}
