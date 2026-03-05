/**
 * Logger sessione training: crea sessione al mount, timer, serie (add/remove/update),
 * Finish con BottomSheet mood picker, salva set e chiude sessione.
 * Supporta gym, tricking, calisthenics.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BottomSheet } from '@/components/BottomSheet';
import {
  addGymSession,
  addGymSet,
  finishGymSession,
  cancelGymSession,
  type TrainingType,
} from '@/lib/actions/training';
import { cancelRunningSession } from '@/lib/actions/running';
import {
  getOtherActiveSession,
  getTrainingStorageKey,
  RUNNING_STORAGE_KEY,
  TYPE_LABELS,
  formatElapsed,
  SESSION_MAX_AGE_MS,
} from '@/lib/session-storage';
import { cn } from '@/lib/utils';
import { Trash2, Plus } from 'lucide-react';

type Set = {
  id?: string;
  exercise: string;
  weight_kg: number | null;
  reps: number | null;
};

const MOODS = [
  { emoji: '💀', label: 'Dead' },
  { emoji: '😓', label: 'Tired' },
  { emoji: '😐', label: 'Ok' },
  { emoji: '💪', label: 'Strong' },
  { emoji: '🔥', label: 'Fire' },
];

const ACCENT_BY_TYPE: Record<TrainingType, string> = {
  gym: 'accent-red',
  tricking: 'accent-red',
  calisthenics: 'accent-red',
  running: 'accent-red',
};

function loadPersistedSession(type: TrainingType): { sessionId: string; startedAt: number } | null {
  if (typeof window === 'undefined' || type === 'running') return null;
  try {
    const raw = localStorage.getItem(getTrainingStorageKey(type));
    if (!raw) return null;
    const data = JSON.parse(raw) as { sessionId: string; startedAt: number };
    if (!data.sessionId || !data.startedAt) return null;
    if (Date.now() - data.startedAt > SESSION_MAX_AGE_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function savePersistedSession(type: TrainingType, sessionId: string, startedAt: number) {
  if (type === 'running') return;
  try {
    localStorage.setItem(getTrainingStorageKey(type), JSON.stringify({ sessionId, startedAt }));
  } catch {
    // ignore
  }
}

function clearPersistedSession(type: TrainingType) {
  if (type === 'running') return;
  try {
    localStorage.removeItem(getTrainingStorageKey(type));
  } catch {
    // ignore
  }
}

export function TrainingSessionLogger({
  type = 'gym',
  backHref = '/training/gym',
}: {
  type?: TrainingType;
  backHref?: string;
}) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [sets, setSets] = useState<Set[]>([]);
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

  const accent = ACCENT_BY_TYPE[type];

  // elapsed calcolato da startedAt, così il timer sopravvive a background/refresh
  const elapsed = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;

  // Controllo altra sessione attiva + restore o crea sessione
  useEffect(() => {
    const other = getOtherActiveSession(type);
    if (other) {
      setBlockedBy(other);
      return;
    }
    setBlockedBy(null);
    const persisted = loadPersistedSession(type);
    if (persisted) {
      setSessionId(persisted.sessionId);
      setStartedAt(persisted.startedAt);
      return;
    }
    addGymSession(type).then((id) => {
      if (id) {
        const now = Date.now();
        setSessionId(id);
        setStartedAt(now);
        savePersistedSession(type, id, now);
      } else {
        setSessionError(true);
      }
    });
  }, [type, initKey]);

  // Timer: re-render ogni secondo per aggiornare elapsed
  useEffect(() => {
    if (showFinishSheet || !startedAt) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [showFinishSheet, startedAt]);

  const addSet = useCallback(() => {
    setSets((s) => [
      ...s,
      {
        exercise: s.length ? s[s.length - 1].exercise : '',
        weight_kg: s.length ? s[s.length - 1].weight_kg : null,
        reps: s.length ? s[s.length - 1].reps : null,
      },
    ]);
  }, []);

  const updateSet = useCallback((idx: number, field: keyof Set, value: string | number | null) => {
    setSets((s) =>
      s.map((set, i) => (i === idx ? { ...set, [field]: value } : set))
    );
  }, []);

  const removeSet = useCallback((idx: number) => {
    setSets((s) => s.filter((_, i) => i !== idx));
  }, []);

  const handleFinish = async () => {
    if (!sessionId || !mood) return;
    setIsFinishing(true);
    clearPersistedSession(type);

    for (let i = 0; i < sets.length; i++) {
      const set = sets[i];
      if (set.exercise.trim()) {
        await addGymSet(sessionId, set.exercise, set.weight_kg, set.reps, i + 1);
      }
    }

    const durationMinutes = Math.ceil(elapsed / 60);
    await finishGymSession(sessionId, mood!, note, durationMinutes);
    setShowFinishSheet(false);
    router.push(backHref);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleCancel = async () => {
    if (!sessionId) return;
    clearPersistedSession(type);
    await cancelGymSession(sessionId);
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
      <div className="px-6 pb-8 space-y-4">
        <div className="card p-5 rounded-xl border-accent-red/30 border-2">
          <p className="text-text-primary font-medium text-body mb-1">Session already in progress</p>
          <p className="text-text-secondary text-footnote">
            You have an active <strong>{otherLabel}</strong> session ({formatElapsed(blockedBy.elapsed)}). Cancel or complete it before starting this workout.
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
        {sessionError ? (
          <>
            <p className="text-text-primary font-medium">Session error</p>
            <p className="text-text-tertiary text-sm mt-2">
              Leave and re-enter with Simulate NFC. If the issue persists, run
              supabase/04-reset-and-seed.sql
            </p>
          </>
        ) : (
          <p className="text-text-tertiary">Loading...</p>
        )}
      </div>
    );
  }

  return (
    <div className="px-6 pb-8">
      <div className="card p-4 mb-6">
        <p className="text-text-tertiary text-sm">Time</p>
        <p className="text-3xl font-mono text-text-primary mt-1">
          {formatTime(elapsed)}
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-primary font-medium">
          {type === 'tricking' ? 'Moves' : 'Sets'}
        </h2>
        <button
          onClick={addSet}
          className={cn('flex items-center gap-2 tap-target', `text-[var(--${accent})]`)}
        >
          <Plus size={20} />
          <span>Add</span>
        </button>
      </div>

      <div className="space-y-3">
        {sets.map((set, idx) => (
          <div key={idx} className="card p-4 flex gap-3 items-center">
            <input
              type="text"
              placeholder={type === 'tricking' ? 'Move' : 'Exercise'}
              value={set.exercise}
              onChange={(e) => updateSet(idx, 'exercise', e.target.value)}
              className="flex-1 bg-transparent text-text-primary placeholder:text-text-tertiary border-b border-separator pb-2 focus:outline-none"
            />
            {type === 'gym' && (
              <>
                <input
                  type="number"
                  placeholder="kg"
                  value={set.weight_kg ?? ''}
                  onChange={(e) =>
                    updateSet(idx, 'weight_kg', e.target.value ? parseFloat(e.target.value) : null)
                  }
                  className="w-16 bg-transparent text-text-primary placeholder:text-text-tertiary border-b border-separator pb-2 focus:outline-none text-center"
                />
                <input
                  type="number"
                  placeholder="reps"
                  value={set.reps ?? ''}
                  onChange={(e) =>
                    updateSet(idx, 'reps', e.target.value ? parseInt(e.target.value, 10) : null)
                  }
                  className="w-14 bg-transparent text-text-primary placeholder:text-text-tertiary border-b border-separator pb-2 focus:outline-none text-center"
                />
              </>
            )}
            {type === 'calisthenics' && (
              <>
                <input
                  type="number"
                  placeholder="reps"
                  value={set.reps ?? ''}
                  onChange={(e) =>
                    updateSet(idx, 'reps', e.target.value ? parseInt(e.target.value, 10) : null)
                  }
                  className="w-16 bg-transparent text-text-primary placeholder:text-text-tertiary border-b border-separator pb-2 focus:outline-none text-center"
                />
                <input
                  type="number"
                  placeholder="kg"
                  value={set.weight_kg ?? ''}
                  onChange={(e) =>
                    updateSet(idx, 'weight_kg', e.target.value ? parseFloat(e.target.value) : null)
                  }
                  className="w-14 bg-transparent text-text-primary placeholder:text-text-tertiary border-b border-separator pb-2 focus:outline-none text-center"
                  title="Added weight (optional)"
                />
              </>
            )}
            <button
              onClick={() => removeSet(idx)}
              className={cn('p-2 text-text-tertiary tap-target', `hover:text-[var(--${accent})]`)}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowFinishSheet(true)}
        className="btn w-full mt-8 text-white rounded-xl font-semibold flex items-center justify-center py-4"
        style={{ backgroundColor: 'var(--accent-red)' }}
      >
        Finish
      </button>
      <button
        type="button"
        onClick={handleCancel}
        className="btn w-full mt-3 rounded-xl font-medium flex items-center justify-center py-4 tap-target bg-surface-elevated text-text-secondary border border-[var(--card-border)]"
      >
        Cancel session
      </button>

      <BottomSheet
        isOpen={showFinishSheet}
        onClose={() => !isFinishing && setShowFinishSheet(false)}
        title="How do you feel?"
      >
        <div className="space-y-6">
          <div className="flex gap-3 flex-wrap">
            {MOODS.map((m) => (
              <button
                key={m.emoji}
                onClick={() => setMood(m.emoji)}
                className={cn(
                  'w-14 h-14 rounded-button flex items-center justify-center text-2xl transition-all',
                  mood === m.emoji
                    ? `bg-[var(--${accent})]/30 border-2`
                    : 'bg-surface-elevated border border-separator'
                )}
                style={mood === m.emoji ? { borderColor: `var(--${accent})` } : undefined}
              >
                {m.emoji}
              </button>
            ))}
          </div>
          <div>
            <label className="text-text-secondary text-sm block mb-2">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
              className="w-full bg-surface-elevated rounded-button p-3 text-text-primary placeholder:text-text-tertiary border border-separator focus:outline-none focus:border-accent-red min-h-[80px]"
            />
          </div>
          <button
            onClick={handleFinish}
            disabled={!mood || isFinishing}
            className={cn(
              'btn w-full',
              mood && !isFinishing
                ? `bg-[var(--${accent})] text-white`
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
