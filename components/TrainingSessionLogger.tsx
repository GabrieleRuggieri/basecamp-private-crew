/**
 * Logger sessione training: crea sessione al mount, timer, serie (add/remove/update),
 * Finish con BottomSheet mood picker, salva set e chiude sessione.
 * Supporta gym, tricking, calisthenics.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BottomSheet } from '@/components/BottomSheet';
import {
  addGymSession,
  addGymSet,
  finishGymSession,
  type TrainingType,
} from '@/lib/actions/training';
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
};

export function TrainingSessionLogger({
  memberId,
  type = 'gym',
  backHref = '/training/gym',
}: {
  memberId: string;
  type?: TrainingType;
  backHref?: string;
}) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sets, setSets] = useState<Set[]>([]);
  const [showFinishSheet, setShowFinishSheet] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const [newPr, setNewPr] = useState<string | null>(null);

  const accent = ACCENT_BY_TYPE[type];

  // Create session on mount
  useEffect(() => {
    addGymSession(memberId, type).then((id) => {
      if (id) setSessionId(id);
      else setSessionError(true);
    });
  }, [memberId, type]);

  // Timer: si ferma quando si apre il sheet Finish
  useEffect(() => {
    if (showFinishSheet) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [showFinishSheet]);

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

    for (let i = 0; i < sets.length; i++) {
      const set = sets[i];
      if (set.exercise.trim()) {
        await addGymSet(sessionId, memberId, set.exercise, set.weight_kg, set.reps, i + 1);
      }
    }

    const durationMinutes = Math.ceil(elapsed / 60);
    const prResult = await finishGymSession(sessionId, memberId, mood!, note, durationMinutes);
    setShowFinishSheet(false);

    if (prResult?.exercise) {
      setNewPr(prResult.exercise);
      await new Promise((r) => setTimeout(r, 2000));
    }

    router.push(backHref);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
        {sessionError ? (
          <>
            <p className="text-text-primary font-medium">Errore sessione</p>
            <p className="text-text-tertiary text-sm mt-2">
              Esci e rientra con Simula NFC. Se il problema persiste, esegui
              supabase/04-reset-and-seed.sql
            </p>
          </>
        ) : (
          <p className="text-text-tertiary">Caricamento...</p>
        )}
      </div>
    );
  }

  return (
    <div className="px-6 pb-8">
      <div className="card p-4 mb-6">
        <p className="text-text-tertiary text-sm">Tempo</p>
        <p className="text-3xl font-mono text-text-primary mt-1">
          {formatTime(elapsed)}
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-primary font-medium">
          {type === 'tricking' ? 'Mosse' : 'Serie'}
        </h2>
        <button
          onClick={addSet}
          className={cn('flex items-center gap-2 tap-target', `text-[var(--${accent})]`)}
        >
          <Plus size={20} />
          <span>Aggiungi</span>
        </button>
      </div>

      <div className="space-y-3">
        {sets.map((set, idx) => (
          <div key={idx} className="card p-4 flex gap-3 items-center">
            <input
              type="text"
              placeholder={type === 'tricking' ? 'Mossa' : 'Esercizio'}
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
                  title="Peso addosso (opzionale)"
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

      <BottomSheet
        isOpen={showFinishSheet}
        onClose={() => !isFinishing && setShowFinishSheet(false)}
        title="Come ti senti?"
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
              placeholder="Opzionale"
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
            {isFinishing ? 'Salvataggio...' : 'Conferma'}
          </button>
        </div>
      </BottomSheet>

      {newPr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-center p-8">
            <p className="text-6xl mb-4">🎉</p>
            <p className={cn('text-2xl font-bold', `text-[var(--${accent})]`)}>Nuovo PR!</p>
            <p className="text-text-primary mt-2">{newPr}</p>
          </div>
        </div>
      )}
    </div>
  );
}
