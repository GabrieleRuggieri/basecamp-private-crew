/**
 * Logger sessione running: crea sessione al mount, timer automatico,
 * input km, pace calcolata in tempo reale, Finish con mood picker e note.
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BottomSheet } from '@/components/BottomSheet';
import { addRunningSession, finishRunningSession, cancelRunningSession } from '@/lib/actions/running';
import { cancelGymSession } from '@/lib/actions/training';
import {
  getOtherActiveSession,
  RUNNING_STORAGE_KEY,
  getTrainingStorageKey,
  TYPE_LABELS,
  formatElapsed,
  SESSION_MAX_AGE_MS,
} from '@/lib/session-storage';
import { cn } from '@/lib/utils';

const MOODS = [
  { emoji: '💀', label: 'Dead' },
  { emoji: '😓', label: 'Tired' },
  { emoji: '😐', label: 'Ok' },
  { emoji: '💪', label: 'Strong' },
  { emoji: '🔥', label: 'Fire' },
];

function formatTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function calcPace(seconds: number, km: number): string {
  if (km <= 0 || seconds <= 0) return '--:--';
  const paceSeconds = seconds / km;
  const paceMin = Math.floor(paceSeconds / 60);
  const paceSec = Math.round(paceSeconds % 60);
  return `${paceMin}:${String(paceSec).padStart(2, '0')}`;
}

function calcPaceFloat(seconds: number, km: number): number {
  if (km <= 0 || seconds <= 0) return 0;
  return seconds / 60 / km;
}

function loadPersistedSession(): { sessionId: string; startedAt: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(RUNNING_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { sessionId: string; startedAt: number };
    if (!data.sessionId || !data.startedAt) return null;
    if (Date.now() - data.startedAt > SESSION_MAX_AGE_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function savePersistedSession(sessionId: string, startedAt: number) {
  try {
    localStorage.setItem(RUNNING_STORAGE_KEY, JSON.stringify({ sessionId, startedAt }));
  } catch {
    // ignore
  }
}

function clearPersistedSession() {
  try {
    localStorage.removeItem(RUNNING_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function RunningSessionLogger({
  backHref = '/training/running',
}: {
  backHref?: string;
}) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [km, setKm] = useState('');
  const [showFinishSheet, setShowFinishSheet] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const [blockedBy, setBlockedBy] = useState<{
    type: 'running' | 'gym' | 'tricking' | 'calisthenics';
    sessionId: string;
    startedAt: number;
    elapsed: number;
  } | null>(null);
  const [initKey, setInitKey] = useState(0);

  // Controllo altra sessione attiva + restore o crea sessione running
  useEffect(() => {
    const other = getOtherActiveSession('running');
    if (other) {
      setBlockedBy(other);
      return;
    }
    setBlockedBy(null);
    const persisted = loadPersistedSession();
    if (persisted) {
      setSessionId(persisted.sessionId);
      setStartedAt(persisted.startedAt);
      return;
    }
    addRunningSession().then((id) => {
      if (id) {
        const now = Date.now();
        setSessionId(id);
        setStartedAt(now);
        savePersistedSession(id, now);
      } else {
        setSessionError(true);
      }
    });
  }, [initKey]);

  // Timer: elapsed calcolato da startedAt, così sopravvive a background/refresh
  const elapsed = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
  useEffect(() => {
    if (showFinishSheet || !startedAt) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [showFinishSheet, startedAt]);

  const kmValue = parseFloat(km) || 0;
  const paceDisplay = calcPace(elapsed, kmValue);

  const handleFinish = async () => {
    if (!sessionId || !mood || kmValue <= 0) return;
    setIsFinishing(true);
    clearPersistedSession();
    const paceFloat = calcPaceFloat(elapsed, kmValue);
    const durationMinutes = Math.ceil(elapsed / 60);
    await finishRunningSession(sessionId, kmValue, paceFloat, mood, note, durationMinutes);
    setShowFinishSheet(false);
    router.push(backHref);
  };

  const handleCancel = async () => {
    if (!sessionId) return;
    clearPersistedSession();
    await cancelRunningSession(sessionId);
    router.push(backHref);
  };

  // Altra sessione già in corso: blocca avvio e invita ad annullare o completare
  if (blockedBy) {
    const otherLabel = TYPE_LABELS[blockedBy.type];
    const otherHref = `/training/${blockedBy.type}/session`;
    const handleCancelOther = async () => {
      if (blockedBy.type === 'running') {
        await cancelRunningSession(blockedBy.sessionId);
        localStorage.removeItem(RUNNING_STORAGE_KEY);
      } else {
        await cancelGymSession(blockedBy.sessionId);
        localStorage.removeItem(getTrainingStorageKey(blockedBy.type));
      }
      setBlockedBy(null);
      setInitKey((k) => k + 1);
    };
    return (
      <div className="px-5 pb-8 space-y-4">
        <div className="card p-5 rounded-xl border-accent-red/30 border-2">
          <p className="text-text-primary font-medium text-body mb-1">Session already in progress</p>
          <p className="text-text-secondary text-footnote">
            You have an active <strong>{otherLabel}</strong> session ({formatElapsed(blockedBy.elapsed)}). Cancel or complete it before starting a run.
          </p>
        </div>
        <Link
          href={otherHref}
          className="btn w-full rounded-xl font-semibold flex items-center justify-center py-4 tap-target bg-accent-red text-white"
        >
          Go to {otherLabel} session
        </Link>
        <button
          type="button"
          onClick={handleCancelOther}
          className="btn w-full rounded-xl font-medium flex items-center justify-center py-4 tap-target bg-surface-elevated text-text-secondary border border-[var(--card-border)]"
        >
          Cancel {otherLabel} session
        </button>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40dvh] px-5 text-center">
        {sessionError ? (
          <>
            <p className="text-text-primary font-medium text-body">Session error</p>
            <p className="text-text-tertiary text-footnote mt-2 max-w-[280px]">
              Leave and re-enter. If the issue persists run supabase/08-add-running.sql
            </p>
          </>
        ) : (
          <p className="text-text-tertiary text-body">Loading...</p>
        )}
      </div>
    );
  }

  return (
    <div className="px-5 pb-8 safe-area-bottom space-y-4">
      {/* Timer — grande e leggibile come app running */}
      <div className="card p-5 rounded-xl">
        <p className="text-text-tertiary text-footnote mb-1">Time</p>
        <p className="text-[2.75rem] sm:text-4xl font-mono font-semibold text-text-primary tabular-nums tracking-tight">
          {formatTime(elapsed)}
        </p>
      </div>

      {/* Km + pace — layout compatto, input 16px per evitare zoom iOS */}
      <div className="card p-5 rounded-xl space-y-4">
        <div>
          <label className="text-text-tertiary text-footnote block mb-2">Distance (km)</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={km}
              onChange={(e) => setKm(e.target.value)}
              placeholder="0.00"
              className="flex-1 min-w-0 bg-transparent text-3xl font-mono font-semibold text-text-primary placeholder:text-text-tertiary border-b-2 border-separator pb-2 focus:outline-none focus:border-accent-red touch-manipulation"
            />
            <span className="text-text-tertiary text-body font-medium shrink-0">km</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-separator">
          <p className="text-text-tertiary text-footnote">Current pace</p>
          <p className="text-text-primary font-mono text-body font-semibold tabular-nums">
            {paceDisplay} <span className="text-text-tertiary text-footnote font-normal">/km</span>
          </p>
        </div>
      </div>

      <button
        onClick={() => setShowFinishSheet(true)}
        className="btn w-full mt-4 text-white rounded-xl font-semibold flex items-center justify-center py-4 tap-target touch-manipulation active:scale-[0.98]"
        style={{ backgroundColor: 'var(--accent-red)' }}
      >
        Finish
      </button>
      <button
        type="button"
        onClick={handleCancel}
        className="btn w-full mt-2 rounded-xl font-medium flex items-center justify-center py-3 tap-target touch-manipulation bg-surface-elevated text-text-tertiary border border-[var(--card-border)]"
      >
        Cancel session
      </button>

      <BottomSheet
        isOpen={showFinishSheet}
        onClose={() => !isFinishing && setShowFinishSheet(false)}
        title="How do you feel?"
      >
        <div className="space-y-5">
          {/* Riepilogo — compatto per iPhone */}
          <div className="grid grid-cols-3 gap-2">
            <div className="card p-3 rounded-xl text-center min-w-0">
              <p className="text-text-tertiary text-caption mb-0.5">Time</p>
              <p className="text-text-primary font-mono text-subhead font-semibold tabular-nums truncate">{formatTime(elapsed)}</p>
            </div>
            <div className="card p-3 rounded-xl text-center min-w-0">
              <p className="text-text-tertiary text-caption mb-0.5">Km</p>
              <p className="text-text-primary font-mono text-subhead font-semibold truncate">{kmValue > 0 ? kmValue.toFixed(2) : '--'}</p>
            </div>
            <div className="card p-3 rounded-xl text-center min-w-0">
              <p className="text-text-tertiary text-caption mb-0.5">Pace</p>
              <p className="text-text-primary font-mono text-subhead font-semibold tabular-nums truncate">{paceDisplay}/km</p>
            </div>
          </div>

          {kmValue <= 0 && (
            <p className="text-accent-red text-footnote text-center">Enter distance (km) before finishing</p>
          )}

          {/* Mood — tap-target 44px minimo per iOS */}
          <div className="flex gap-2 flex-wrap justify-center">
            {MOODS.map((m) => (
              <button
                key={m.emoji}
                onClick={() => setMood(m.emoji)}
                className={cn(
                  'tap-target min-w-[52px] min-h-[52px] w-[52px] h-[52px] rounded-button flex items-center justify-center text-2xl transition-all touch-manipulation active:scale-95',
                  mood === m.emoji
                    ? 'bg-accent-red/30 border-2 border-accent-red'
                    : 'bg-surface-elevated border border-separator'
                )}
              >
                {m.emoji}
              </button>
            ))}
          </div>

          {/* Note */}
          <div>
            <label className="text-text-secondary text-footnote block mb-2">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
              className="w-full bg-surface-elevated rounded-button p-3 text-body text-text-primary placeholder:text-text-tertiary border border-separator focus:outline-none focus:border-accent-red min-h-[80px] touch-manipulation"
            />
          </div>

          <button
            onClick={handleFinish}
            disabled={!mood || isFinishing || kmValue <= 0}
            className={cn(
              'btn w-full rounded-xl tap-target touch-manipulation',
              mood && !isFinishing && kmValue > 0
                ? 'bg-accent-red text-white'
                : 'bg-surface-elevated text-text-tertiary cursor-not-allowed'
            )}
          >
            {isFinishing ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
