/**
 * Debug: restituisce l'utente corrente (per verificare la sessione).
 * Rimuovere in produzione.
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/actions/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null, message: 'Non autenticato' });
  }
  return NextResponse.json({
    user: { memberId: session.memberId, name: session.name, emoji: session.emoji },
  });
}
