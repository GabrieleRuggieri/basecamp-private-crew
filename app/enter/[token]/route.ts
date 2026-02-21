/**
 * Route Handler: /enter/[token] — login via NFC.
 * Usa (request, response) con iron-session: cookies() + redirect non merge in locale.
 */
import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { validateNfcToken } from '@/lib/validate-token';
import { sessionOptions } from '@/lib/session';
import type { BasecampSession } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const sessionData = await validateNfcToken(token);
  if (!sessionData) {
    return new NextResponse(
      `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>BASECAMP</title></head><body style="background:#000;color:rgba(235,235,245,0.6);display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:17px"><p style="text-align:center">This link isn't valid.</p></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }

  const html = `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta http-equiv="refresh" content="0;url=/enter/transition"/><title>BASECAMP</title></head><body style="background:#000;color:rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:-apple-system,sans-serif"><p>Entro...</p></body></html>`;
  const response = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });

  const ironSession = await getIronSession<{ user?: BasecampSession }>(
    request,
    response,
    sessionOptions
  );
  ironSession.user = sessionData;
  await ironSession.save();

  return response;
}
