/**
 * Server Actions per autenticazione.
 * getSession: legge la sessione dal cookie (memberId, name, emoji, role).
 * logout: distrugge il cookie e redirect a /.
 */
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import type { BasecampSession } from '@/lib/types';

export async function getSession(): Promise<BasecampSession | null> {
  const cookieStore = await cookies();
  const ironSession = await getIronSession<{ user?: BasecampSession }>(
    cookieStore,
    sessionOptions
  );
  return ironSession.user ?? null;
}

export async function logout() {
  const cookieStore = await cookies();
  const ironSession = await getIronSession<{ user?: BasecampSession }>(
    cookieStore,
    sessionOptions
  );
  ironSession.destroy();
  redirect('/');
}
