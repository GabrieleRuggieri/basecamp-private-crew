/**
 * Server Actions per Travels (viaggi).
 * getTravels: lista viaggi del membro (visited/wishlist).
 * addTravel: aggiunge un viaggio, revalida /travels.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export async function getTravels(memberId: string) {
  const { data } = await supabase
    .from('travels')
    .select('id, member_id, title, location, country_emoji, status, year, note')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  return data ?? [];
}

export async function addTravel(
  memberId: string,
  title: string,
  location: string,
  countryEmoji: string | null,
  status: 'visited' | 'wishlist',
  year: number | null,
  note: string | null
) {
  const { error } = await supabase.from('travels').insert({
    member_id: memberId,
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
