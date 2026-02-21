/**
 * Crew attivi oggi (Today's pulse).
 * getCrewActiveToday: membri che hanno fatto gym o thoughts oggi.
 * Usato per gli avatar con ring verde sulla home.
 */
'use server';

import { supabase } from '@/lib/supabase';

export async function getCrewActiveToday() {
  const today = new Date().toISOString().slice(0, 10);

  const { data: sessions } = await supabase
    .from('gym_sessions')
    .select('member_id')
    .gte('started_at', `${today}T00:00:00`)
    .lte('started_at', `${today}T23:59:59`);

  const { data: thoughts } = await supabase
    .from('thoughts')
    .select('member_id')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);

  const memberIds = new Set<string>();
  (sessions ?? []).forEach((s) => memberIds.add(s.member_id));
  (thoughts ?? []).forEach((t) => memberIds.add(t.member_id));

  if (memberIds.size === 0) return [];

  const { data: members } = await supabase
    .from('members')
    .select('id, name, emoji')
    .in('id', Array.from(memberIds))
    .eq('is_active', true);

  return members ?? [];
}
