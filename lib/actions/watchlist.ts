/**
 * Server Actions per Watchlist (film, serie, libri).
 * getWatchlist: lista titoli del membro.
 * addWatchlistItem: aggiunge un titolo (status: want/doing/done).
 * updateWatchlistStatus: cambia lo status di un titolo.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export async function getWatchlist(memberId: string) {
  const { data } = await supabase
    .from('watchlist')
    .select('id, member_id, title, type, status')
    .eq('member_id', memberId)
    .order('added_at', { ascending: false });

  return data ?? [];
}

export async function addWatchlistItem(
  memberId: string,
  title: string,
  type: 'movie' | 'series' | 'book' | 'podcast' | 'other',
  status: 'want' | 'doing' | 'done'
) {
  const { error } = await supabase.from('watchlist').insert({
    member_id: memberId,
    title,
    type,
    status,
  });
  if (error) console.error('addWatchlistItem', error);
  else revalidatePath('/watchlist');
}

export async function updateWatchlistStatus(id: string, status: 'want' | 'doing' | 'done') {
  const { error } = await supabase
    .from('watchlist')
    .update({ status })
    .eq('id', id);
  if (error) console.error('updateWatchlistStatus', error);
  else revalidatePath('/watchlist');
}
