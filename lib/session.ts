/**
 * Configurazione iron-session per la sessione utente.
 * Cookie criptato, TTL 1 ora, httpOnly per sicurezza.
 */
import type { SessionOptions } from 'iron-session';
import type { BasecampSession } from './types';

export const sessionOptions: SessionOptions = {
  password: process.env.BASECAMP_SESSION_SECRET!,
  cookieName: 'basecamp_session',
  ttl: 60 * 60, // 1 ora in secondi
  cookieOptions: {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
};

declare module 'iron-session' {
  interface IronSessionData {
    user?: BasecampSession;
  }
}
