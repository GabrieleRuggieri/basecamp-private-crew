/**
 * Log workout manually: date, duration, sets (or km for running), mood, note.
 * No timer; data entered after the fact.
 */
'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BackButton } from '@/components/BackButton';
import { createManualGymSession } from '@/lib/actions/training';
import { createManualRunningSession } from '@/lib/actions/running';
import { cn } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import type { TrainingType } from '@/lib/actions/training';

const MOODS = [
  { emoji: '💀', label: 'Dead' },
  { emoji: '😓', label: 'Tired' },
  { emoji: '😐', label: 'Ok' },
  { emoji: '💪', label: 'Strong' },
  { emoji: '🔥', label: 'Fire' },
];

const ACCENT = 'accent-red';

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

type SetRow = { exercise: string; weight_kg: number | null; reps: number | null };

export default function LogWorkoutPage() {
  const router = useRouter();
  const params = useParams();
  const type = (params?.type as string) ?? '';
  const validTypes: TrainingType[] = ['gym', 'tricking', 'calisthenics', 'running'];
  const trainingType = validTypes.includes(type as TrainingType) ? (type as TrainingType) : null;

  const [date, setDate] = useState(todayISO());
  const [durationMinutes, setDurationMinutes] = useState('');
  const [sets, setSets] = useState<SetRow[]>([{ exercise: '', weight_kg: null, reps: null }]);
  const [km, setKm] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addSet = () => setSets((s) => [...s, { exercise: '', weight_kg: null, reps: null }]);
  const removeSet = (idx: number) => setSets((s) => s.filter((_, i) => i !== idx));
  const updateSet = (idx: number, field: keyof SetRow, value: string | number | null) => {
    setSets((s) => {
      const next = [...s];
      if (field === 'exercise') next[idx] = { ...next[idx], exercise: value as string };
      else if (field === 'weight_kg') next[idx] = { ...next[idx], weight_kg: value as number | null };
      else next[idx] = { ...next[idx], reps: value as number | null };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainingType || !mood) return;
    const duration = Math.round(parseFloat(durationMinutes) || 0);
    if (duration <= 0) return;

    if (trainingType === 'running') {
      const kmNum = parseFloat(km) || 0;
      if (kmNum <= 0) return;
      setIsSubmitting(true);
      await createManualRunningSession(date, duration, kmNum, mood, note);
      setIsSubmitting(false);
      router.push(`/training/${type}`);
      router.refresh();
      return;
    }

    const setsToSend = sets
      .filter((s) => s.exercise.trim())
      .map((s) => ({
        exercise: s.exercise.trim(),
        weight_kg: s.weight_kg,
        reps: s.reps,
      }));
    if (setsToSend.length === 0) return;

    setIsSubmitting(true);
    await createManualGymSession(trainingType, date, duration, mood, note, setsToSend);
    setIsSubmitting(false);
    router.push(`/training/${type}`);
    router.refresh();
  };

  if (!trainingType) {
    return (
      <main className="min-h-dvh px-5 pt-4">
        <BackButton href="/training" />
        <p className="text-text-tertiary mt-4">Invalid workout type.</p>
      </main>
    );
  }

  const isRunning = trainingType === 'running';
  const durationNum = parseFloat(durationMinutes) || 0;
  const kmNum = parseFloat(km) || 0;
  const paceDisplay =
    isRunning && kmNum > 0 && durationNum > 0
      ? `${(durationNum / kmNum).toFixed(1)} min/km`
      : null;

  const backHref = `/training/${type}`;

  return (
    <main className="min-h-dvh w-full max-w-full overflow-x-hidden">
      <div className="px-5 pb-8 w-full max-w-full min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 pt-4 pb-2 safe-area-top min-w-0">
        <BackButton href={backHref} />
        <h1 className="text-title font-bold text-text-primary flex-1 min-w-0 truncate" style={{ letterSpacing: '-0.04em' }}>
          Log workout
        </h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 w-full max-w-full min-w-0" data-log-workout>
        <div className="card p-4 rounded-xl space-y-4 w-full max-w-full min-w-0 overflow-hidden">
          <div className="w-full min-w-0 overflow-hidden">
            <label className="text-text-secondary text-sm block mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full max-w-full min-w-0 bg-surface-elevated rounded-xl p-3 text-text-primary border border-[var(--card-border)] focus:outline-none focus:border-[var(--accent-red)] text-base touch-manipulation box-border"
              style={{ width: '100%' }}
            />
          </div>
          <div className="w-full min-w-0 overflow-hidden">
            <label className="text-text-secondary text-sm block mb-2">Duration (minutes)</label>
            <input
              type="number"
              min="1"
              step="1"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="e.g. 45"
              className="w-full max-w-full min-w-0 bg-surface-elevated rounded-xl p-3 text-text-primary placeholder:text-text-tertiary border border-[var(--card-border)] focus:outline-none focus:border-[var(--accent-red)] text-base touch-manipulation box-border"
              style={{ width: '100%' }}
            />
          </div>

          {isRunning && (
            <>
              <div className="w-full min-w-0 overflow-hidden">
                <label className="text-text-secondary text-sm block mb-2">Distance (km)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  placeholder="e.g. 5.2"
                  className="w-full max-w-full min-w-0 bg-surface-elevated rounded-xl p-3 text-text-primary placeholder:text-text-tertiary border border-[var(--card-border)] focus:outline-none focus:border-[var(--accent-red)] text-base touch-manipulation box-border"
                  style={{ width: '100%' }}
                />
              </div>
              {paceDisplay && (
                <p className="text-text-tertiary text-sm">Pace: {paceDisplay}</p>
              )}
            </>
          )}

          {!isRunning && (
            <div className="space-y-3 w-full min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-2 w-full min-w-0">
                <label className="text-text-secondary text-sm shrink-0">
                  {trainingType === 'tricking' ? 'Moves' : 'Sets'}
                </label>
                <button type="button" onClick={addSet} className={cn('flex items-center gap-2 tap-target shrink-0', 'text-[var(--accent-red)]')}>
                  <Plus size={18} />
                  Add
                </button>
              </div>
              {sets.map((set, idx) => (
                <div key={idx} className="flex gap-2 items-center w-full min-w-0 overflow-hidden">
                  <input
                    type="text"
                    placeholder={trainingType === 'tricking' ? 'Move' : 'Exercise'}
                    value={set.exercise}
                    onChange={(e) => updateSet(idx, 'exercise', e.target.value)}
                    className="flex-1 min-w-0 bg-surface-elevated rounded-lg px-3 py-2 text-text-primary placeholder:text-text-tertiary border border-[var(--card-border)] focus:outline-none text-base touch-manipulation box-border"
                  />
                  {trainingType === 'gym' && (
                    <>
                      <input
                        type="number"
                        placeholder="kg"
                        value={set.weight_kg ?? ''}
                        onChange={(e) =>
                          updateSet(idx, 'weight_kg', e.target.value ? parseFloat(e.target.value) : null)
                        }
                        className="w-12 min-w-[3rem] shrink-0 bg-surface-elevated rounded-lg px-1 py-2 text-center text-text-primary border border-[var(--card-border)] focus:outline-none text-base touch-manipulation"
                      />
                      <input
                        type="number"
                        placeholder="reps"
                        value={set.reps ?? ''}
                        onChange={(e) =>
                          updateSet(idx, 'reps', e.target.value ? parseInt(e.target.value, 10) : null)
                        }
                        className="w-12 min-w-[3rem] shrink-0 bg-surface-elevated rounded-lg px-1 py-2 text-center text-text-primary border border-[var(--card-border)] focus:outline-none text-base touch-manipulation"
                      />
                    </>
                  )}
                  {trainingType === 'calisthenics' && (
                    <>
                      <input
                        type="number"
                        placeholder="kg"
                        title="Added weight (optional)"
                        value={set.weight_kg ?? ''}
                        onChange={(e) =>
                          updateSet(idx, 'weight_kg', e.target.value ? parseFloat(e.target.value) : null)
                        }
                        className="w-12 min-w-[3rem] shrink-0 bg-surface-elevated rounded-lg px-1 py-2 text-center text-text-primary border border-[var(--card-border)] focus:outline-none text-base touch-manipulation"
                      />
                      <input
                        type="number"
                        placeholder="reps"
                        value={set.reps ?? ''}
                        onChange={(e) =>
                          updateSet(idx, 'reps', e.target.value ? parseInt(e.target.value, 10) : null)
                        }
                        className="w-12 min-w-[3rem] shrink-0 bg-surface-elevated rounded-lg px-1 py-2 text-center text-text-primary border border-[var(--card-border)] focus:outline-none text-base touch-manipulation"
                      />
                    </>
                  )}
                  {trainingType === 'tricking' && (
                    <input
                      type="number"
                      placeholder="reps"
                      value={set.reps ?? ''}
                      onChange={(e) =>
                        updateSet(idx, 'reps', e.target.value ? parseInt(e.target.value, 10) : null)
                      }
                      className="w-12 min-w-[3rem] shrink-0 bg-surface-elevated rounded-lg px-1 py-2 text-center text-text-primary border border-[var(--card-border)] focus:outline-none text-base touch-manipulation"
                    />
                  )}
                  <button type="button" onClick={() => removeSet(idx)} className="p-2 text-text-tertiary tap-target shrink-0">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-4 rounded-xl w-full max-w-full min-w-0 overflow-hidden">
          <label className="text-text-secondary text-sm block mb-2">How do you feel?</label>
          <div className="flex gap-2 flex-wrap">
            {MOODS.map((m) => (
              <button
                key={m.emoji}
                type="button"
                onClick={() => setMood(m.emoji)}
                className={cn(
                  'w-12 h-12 rounded-button flex items-center justify-center text-xl transition-all',
                  mood === m.emoji ? 'bg-[var(--accent-red)]/30 border-2 border-[var(--accent-red)]' : 'bg-surface-elevated border border-separator'
                )}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4 rounded-xl w-full max-w-full min-w-0 overflow-hidden">
          <label className="text-text-secondary text-sm block mb-2">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
            className="w-full max-w-full min-w-0 bg-surface-elevated rounded-xl p-3 text-text-primary placeholder:text-text-tertiary border border-[var(--card-border)] focus:outline-none min-h-[80px] text-base touch-manipulation box-border"
            style={{ width: '100%' }}
          />
        </div>

        <button
          type="submit"
          disabled={
            !mood ||
            isSubmitting ||
            (durationNum <= 0) ||
            (isRunning ? kmNum <= 0 : !sets.some((s) => s.exercise.trim()))
          }
          className={cn(
            'btn w-full rounded-xl font-semibold py-4',
            mood && !isSubmitting ? 'bg-[var(--accent-red)] text-white' : 'bg-surface-elevated text-text-tertiary cursor-not-allowed'
          )}
        >
          {isSubmitting ? 'Saving...' : 'Save workout'}
        </button>
        </form>
      </div>
    </main>
  );
}
