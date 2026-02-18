/**
 * Server Actions per reazioni (emoji su thoughts, moments, ecc).
 * addReaction: aggiunge/toggle reazione (upsert).
 * removeReaction: rimuove la reazione del membro.
 */
'use server';

import { supabase } from '@/lib/supabase';

export async function addReaction(
  memberId: string,
  targetType: string,
  targetId: string,
  emoji: string
) {
  const { error } = await supabase.from('reactions').upsert(
    { member_id: memberId, target_type: targetType, target_id: targetId, emoji },
    { onConflict: 'member_id,target_type,target_id' }
  );
  if (error) console.error('addReaction', error);
}

export async function removeReaction(
  memberId: string,
  targetType: string,
  targetId: string
) {
  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('member_id', memberId)
    .eq('target_type', targetType)
    .eq('target_id', targetId);
  if (error) console.error('removeReaction', error);
}
