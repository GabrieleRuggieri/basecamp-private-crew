/**
 * Server Actions per Watchlist (film, serie, libri).
 * getWatchlist: lista titoli del membro autenticato.
 * addWatchlistItem: aggiunge un titolo (status: want/doing/done).
 * updateWatchlistStatus: cambia lo status di un titolo.
 * updateWatchlistItem: modifica titolo e tipo.
 * memberId viene sempre letto da getSession() — mai accettato dal client.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/actions/auth';

export async function getWatchlist() {
  const session = await getSession();
  if (!session) return [];

  const { data } = await supabase
    .from('watchlist')
    .select('id, member_id, title, type, status')
    .order('added_at', { ascending: false });

  return data ?? [];
}

export async function addWatchlistItem(
  title: string,
  type: 'movie' | 'series' | 'book' | 'podcast' | 'other',
  status: 'want' | 'doing' | 'done'
) {
  const session = await getSession();
  if (!session) return;

  const { error } = await supabase.from('watchlist').insert({
    member_id: session.memberId,
    title,
    type,
    status,
  });
  if (error) console.error('addWatchlistItem', error);
  else revalidatePath('/watchlist');
}

export async function updateWatchlistStatus(id: string, status: 'want' | 'doing' | 'done') {
  const session = await getSession();
  if (!session) return;

  const { error } = await supabase
    .from('watchlist')
    .update({ status })
    .eq('id', id)
    .eq('member_id', session.memberId);
  if (error) console.error('updateWatchlistStatus', error);
  else revalidatePath('/watchlist');
}

export async function updateWatchlistItem(
  id: string,
  title: string,
  type: 'movie' | 'series' | 'book' | 'podcast' | 'other'
) {
  const session = await getSession();
  if (!session) return;

  const { error } = await supabase
    .from('watchlist')
    .update({ title, type })
    .eq('id', id)
    .eq('member_id', session.memberId);
  if (error) console.error('updateWatchlistItem', error);
  else {
    revalidatePath('/watchlist');
    revalidatePath('/home');
  }
}
