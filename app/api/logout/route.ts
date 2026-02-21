/**
 * Route Handler: logout — distrugge il cookie di sessione e redirect a /.
 * Usa (request, response) con iron-session: cookies() + redirect non merge in locale.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import type { BasecampSession } from '@/lib/types';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL('/', url.origin));

  const ironSession = await getIronSession<{ user?: BasecampSession }>(
    request,
    response,
    sessionOptions
  );
  ironSession.destroy();

  return response;
}
