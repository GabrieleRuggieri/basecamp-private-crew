/**
 * Server Actions per autenticazione.
 * getSession: legge la sessione dal cookie (memberId, name, emoji, role).
 * Se il membro non esiste più nel DB (rimosso, reset) → redirect a /api/logout
 * che cancella il cookie e porta alla landing. Evita foreign key error.
 */
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import type { BasecampSession } from '@/lib/types';

export async function getSession(): Promise<BasecampSession | null> {
  const cookieStore = await cookies();
  const ironSession = await getIronSession<{ user?: BasecampSession }>(
    cookieStore,
    sessionOptions
  );
  const user = ironSession.user;
  if (!user) return null;

  const { data } = await supabase
    .from('members')
    .select('id')
    .eq('id', user.memberId)
    .eq('is_active', true)
    .single();

  if (!data) {
    redirect('/api/logout');
  }

  return user;
}
