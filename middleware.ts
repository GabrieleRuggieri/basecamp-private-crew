/**
 * Middleware Next.js: protegge le route /home, /gym, /travels, etc.
 * Se non c'è cookie basecamp_session → redirect a /.
 * /enter e /admin bypassano (login e pannello admin).
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = [
  '/home',
  '/training',
  '/travels',
  '/thoughts',
  '/watchlist',
  '/moments',
];

const BYPASS_PATHS = ['/enter', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect /gym -> /training/gym (backwards compatibility)
  if (pathname === '/gym' || pathname.startsWith('/gym/')) {
    const newPath = pathname.replace(/^\/gym/, '/training/gym');
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // Bypass per /enter/[token] e /admin/[token]
  if (pathname.startsWith('/enter/') || pathname.startsWith('/admin/')) {
    return NextResponse.next();
  }

  // Proteggi le route
  const isProtected = PROTECTED_PATHS.some((p) =>
    pathname === p || pathname.startsWith(p + '/')
  );

  if (isProtected) {
    const sessionCookie = request.cookies.get('basecamp_session');
    if (!sessionCookie?.value) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|manifest.json).*)'],
};
