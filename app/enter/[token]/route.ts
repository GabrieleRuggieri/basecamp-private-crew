/**
 * Route Handler: /enter/[token] — login via NFC.
 * Valida token, salva sessione in cookie, redirect a /home.
 * Token invalido → pagina "This link isn't valid".
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { validateNfcToken } from '@/lib/validate-token';
import { sessionOptions } from '@/lib/session';
import type { BasecampSession } from '@/lib/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const session = await validateNfcToken(token);
  if (!session) {
    return new NextResponse(
      `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>BASECAMP</title></head><body style="background:#000;color:rgba(235,235,245,0.6);display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:17px"><p style="text-align:center">This link isn't valid.</p></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }

  const cookieStore = await cookies();
  const ironSession = await getIronSession<{ user?: BasecampSession }>(
    cookieStore,
    sessionOptions
  );
  ironSession.user = session;
  await ironSession.save();

  const baseUrl = new URL(_request.url).origin;
  return NextResponse.redirect(new URL('/enter/transition', baseUrl), 302);
}
