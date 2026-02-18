/**
 * Configurazione iron-session per la sessione utente.
 * Cookie criptato, TTL 30 giorni, httpOnly per sicurezza.
 */
import type { SessionOptions } from 'iron-session';
import type { BasecampSession } from './types';

export const sessionOptions: SessionOptions = {
  password: process.env.BASECAMP_SESSION_SECRET!,
  cookieName: 'basecamp_session',
  ttl: 60 * 60 * 24 * 30, // 30 days in seconds
  cookieOptions: {
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
