/**
 * Server Actions per Travels (viaggi).
 * getTravels: lista viaggi del membro autenticato (visited/wishlist).
 * addTravel: aggiunge un viaggio, revalida /travels.
 * memberId viene sempre letto da getSession() — mai accettato dal client.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/actions/auth';

export async function getTravels() {
  const session = await getSession();
  if (!session) return [];

  const { data } = await supabase
    .from('travels')
    .select('id, member_id, title, location, country_emoji, status, year, note')
    .order('created_at', { ascending: false });

  return data ?? [];
}

export async function addTravel(
  title: string,
  location: string,
  countryEmoji: string | null,
  status: 'visited' | 'wishlist',
  year: number | null,
  note: string | null
) {
  const session = await getSession();
  if (!session) return;

  const { error } = await supabase.from('travels').insert({
    member_id: session.memberId,
    title,
    location,
    country_emoji: countryEmoji,
    status,
    year,
    note,
  });
  if (error) console.error('addTravel', error);
  else revalidatePath('/travels');
}

export async function updateTravel(
  travelId: string,
  data: {
    title: string;
    location: string;
    country_emoji: string | null;
    status: 'visited' | 'wishlist';
    year: number | null;
    note: string | null;
  }
) {
  const session = await getSession();
  if (!session) return;

  const { error } = await supabase
    .from('travels')
    .update({
      title: data.title,
      location: data.location,
      country_emoji: data.country_emoji,
      status: data.status,
      year: data.year,
      note: data.note,
    })
    .eq('id', travelId)
    .eq('member_id', session.memberId);

  if (error) console.error('updateTravel', error);
  else {
    revalidatePath('/travels');
    revalidatePath('/home');
  }
}
