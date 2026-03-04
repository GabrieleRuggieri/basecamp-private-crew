/**
 * Helper client-side per sessioni di training persistite in localStorage.
 * Usato per: ripristinare sessione, annullare, bloccare avvio se c'è già un'altra attiva.
 */

export const SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 ore

export const RUNNING_STORAGE_KEY = 'basecamp_running_session';

export function getTrainingStorageKey(type: 'gym' | 'tricking' | 'calisthenics') {
  return `basecamp_training_session_${type}`;
}

export type ActiveSessionInfo = {
  type: 'running' | 'gym' | 'tricking' | 'calisthenics';
  sessionId: string;
  startedAt: number;
  elapsed: number;
};

function parseStored(
  key: string
): { sessionId: string; startedAt: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as { sessionId?: string; startedAt?: number };
    if (!data.sessionId || !data.startedAt) return null;
    if (Date.now() - data.startedAt > SESSION_MAX_AGE_MS) return null;
    return { sessionId: data.sessionId, startedAt: data.startedAt };
  } catch {
    return null;
  }
}

/**
 * Restituisce un'altra sessione attiva (diversa da currentType), se esiste.
 * Usato per bloccare l'avvio di una nuova sessione finché l'altra non è annullata o finita.
 */
export function getOtherActiveSession(
  currentType: 'running' | 'gym' | 'tricking' | 'calisthenics'
): ActiveSessionInfo | null {
  if (typeof window === 'undefined') return null;

  const checks: { key: string; type: ActiveSessionInfo['type'] }[] = [
    { key: RUNNING_STORAGE_KEY, type: 'running' },
    { key: getTrainingStorageKey('gym'), type: 'gym' },
    { key: getTrainingStorageKey('tricking'), type: 'tricking' },
    { key: getTrainingStorageKey('calisthenics'), type: 'calisthenics' },
  ];

  for (const { key, type } of checks) {
    if (type === currentType) continue;
    const data = parseStored(key);
    if (data) {
      const elapsed = Math.floor((Date.now() - data.startedAt) / 1000);
      return { type, sessionId: data.sessionId, startedAt: data.startedAt, elapsed };
    }
  }
  return null;
}

export const TYPE_LABELS: Record<ActiveSessionInfo['type'], string> = {
  running: 'Running',
  gym: 'Gym',
  tricking: 'Tricking',
  calisthenics: 'Calisthenics',
};

function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function formatElapsed(seconds: number): string {
  return formatTime(seconds);
}
