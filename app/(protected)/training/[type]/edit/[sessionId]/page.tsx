/**
 * Edit workout: modifica sessione completata (solo creatore).
 * Supporta gym, tricking, calisthenics e running.
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BackButton } from '@/components/BackButton';
import { getGymSessionForEdit, updateGymSession } from '@/lib/actions/training';
import { getRunningSessionForEdit, updateRunningSession } from '@/lib/actions/running';
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

type SetRow = {
  exercise: string;
  weight_kg: number | null;
  reps: string;
  sets_count: number | null;
};

export default function EditWorkoutPage() {
  const router = useRouter();
  const params = useParams();
  const type = (params?.type as string) ?? '';
  const sessionId = (params?.sessionId as string) ?? '';
  const validTypes: TrainingType[] = ['gym', 'tricking', 'calisthenics', 'running'];
  const trainingType = validTypes.includes(type as TrainingType) ? (type as TrainingType) : null;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [date, setDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [sets, setSets] = useState<SetRow[]>([]);
  const [km, setKm] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRunning = trainingType === 'running';

  useEffect(() => {
    if (!sessionId || !trainingType) return;
    const load = async () => {
      if (isRunning) {
        const data = await getRunningSessionForEdit(sessionId);
        if (!data) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setDate(data.date);
        setDurationMinutes(String(data.duration_minutes));
        setKm(String(data.km));
        setMood(data.mood);
        setNote(data.note);
      } else {
        const data = await getGymSessionForEdit(sessionId);
        if (!data) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setDate(data.date);
        setDurationMinutes(String(data.duration_minutes));
        setMood(data.mood);
        setNote(data.note);
        const rows: SetRow[] = data.sets.map((s) => ({
          exercise: s.exercise,
          weight_kg: s.weight_kg,
          reps: s.reps,
          sets_count: s.sets_count,
        }));
        setSets(rows.length > 0 ? rows : [{ exercise: '', weight_kg: null, reps: '', sets_count: 1 }]);
      }
      setLoading(false);
    };
    load();
  }, [sessionId, trainingType, isRunning]);

  const addSet = () =>
    setSets((s) => [
      ...s,
      {
        exercise: '',
        weight_kg: null,
        reps: '',
        sets_count: type === 'gym' || type === 'calisthenics' ? 1 : null,
      },
    ]);
  const removeSet = (idx: number) => setSets((s) => s.filter((_, i) => i !== idx));
  const updateSet = (idx: number, field: keyof SetRow, value: string | number | null) => {
    setSets((s) => {
      const next = [...s];
      const cur = next[idx];
      if (field === 'exercise') next[idx] = { ...cur, exercise: value as string };
      else if (field === 'weight_kg') next[idx] = { ...cur, weight_kg: value as number | null };
      else if (field === 'reps') next[idx] = { ...cur, reps: value !== null ? String(value) : '' };
      else if (field === 'sets_count') next[idx] = { ...cur, sets_count: value as number | null };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainingType || !mood) return;
    const duration = Math.round(parseFloat(durationMinutes) || 0);
    if (duration <= 0) return;
    setError(null);
    setIsSubmitting(true);

    if (isRunning) {
      const kmNum = parseFloat(km) || 0;
      if (kmNum <= 0) {
        setError('Inserisci km validi');
        setIsSubmitting(false);
        return;
      }
      const result = await updateRunningSession(sessionId, date, duration, kmNum, mood, note);
      if (result.ok) {
        router.push(`/training/${type}`);
        router.refresh();
      } else {
        setError(result.error ?? 'Errore');
      }
    } else {
      const setsToSend = sets
        .filter((s) => s.exercise.trim())
        .map((s) => ({
          exercise: s.exercise.trim(),
          weight_kg: s.weight_kg,
          sets_count: s.sets_count ?? 1,
          reps: s.reps.trim(),
        }));
      if (setsToSend.length === 0) {
        setError('Aggiungi almeno un esercizio');
        setIsSubmitting(false);
        return;
      }
      const result = await updateGymSession(sessionId, mood, note, duration, setsToSend);
      if (result.ok) {
        router.push(`/training/${type}`);
        router.refresh();
      } else {
        setError(result.error ?? 'Errore');
      }
    }
    setIsSubmitting(false);
  };

  if (!trainingType) {
    return (
      <main className="min-h-dvh px-5 pt-4">
        <BackButton href="/training" />
        <p className="text-text-tertiary mt-4">Tipo non valido.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-dvh px-5 pt-4">
        <BackButton href={`/training/${type}`} />
        <p className="text-text-tertiary mt-4">Caricamento...</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-dvh px-5 pt-4">
        <BackButton href={`/training/${type}`} />
        <p className="text-text-tertiary mt-4">Sessione non trovata o non modificabile.</p>
      </main>
    );
  }

  const durationNum = parseFloat(durationMinutes) || 0;
  const kmNum = parseFloat(km) || 0;
  const paceDisplay =
    isRunning && kmNum > 0 && durationNum > 0
      ? `${(durationNum / kmNum).toFixed(1)} min/km`
      : null;

  return (
    <main className="min-h-dvh w-full max-w-full overflow-x-hidden">
      <div className="px-5 pb-8 w-full max-w-full min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 pt-4 pb-2 safe-area-top min-w-0">
          <BackButton href={`/training/${type}`} />
          <h1
            className="text-title font-bold text-text-primary flex-1 min-w-0 truncate"
            style={{ letterSpacing: '-0.04em' }}
          >
            Modifica allenamento
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 w-full max-w-full min-w-0">
          <div className="card p-4 rounded-xl space-y-4">
            <div>
              <label className="text-text-secondary text-sm block mb-2">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface-elevated rounded-xl p-3 text-text-primary border border-[var(--card-border)]"
              />
            </div>
            <div>
              <label className="text-text-secondary text-sm block mb-2">Durata (minuti)</label>
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="es. 45"
                className="w-full bg-surface-elevated rounded-xl p-3 text-text-primary placeholder:text-text-tertiary border border-[var(--card-border)]"
              />
            </div>

            {isRunning && (
              <>
                <div>
                  <label className="text-text-secondary text-sm block mb-2">Distanza (km)</label>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={km}
                    onChange={(e) => setKm(e.target.value)}
                    placeholder="es. 5.2"
                    className="w-full bg-surface-elevated rounded-xl p-3 text-text-primary placeholder:text-text-tertiary border border-[var(--card-border)]"
                  />
                </div>
                {paceDisplay && <p className="text-text-tertiary text-sm">Pace: {paceDisplay}</p>}
              </>
            )}

            {!isRunning && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-text-secondary text-sm">
                    {type === 'tricking' ? 'Moves' : 'Esercizi'}
                  </label>
                  <button
                    type="button"
                    onClick={addSet}
                    className="flex items-center gap-2 text-[var(--accent-red)]"
                  >
                    <Plus size={18} />
                    Aggiungi
                  </button>
                </div>
                {sets.map((set, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder={type === 'tricking' ? 'Move' : 'Esercizio'}
                      value={set.exercise}
                      onChange={(e) => updateSet(idx, 'exercise', e.target.value)}
                      className="flex-1 min-w-0 bg-surface-elevated rounded-lg px-3 py-2 text-text-primary placeholder:text-text-tertiary border border-[var(--card-border)]"
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
                          className="w-12 bg-surface-elevated rounded-lg px-1 py-2 text-center text-text-primary border border-[var(--card-border)]"
                        />
                        <input
                          type="number"
                          placeholder="sets"
                          min={1}
                          value={set.sets_count ?? ''}
                          onChange={(e) =>
                            updateSet(idx, 'sets_count', e.target.value ? parseInt(e.target.value, 10) : null)
                          }
                          className="w-12 bg-surface-elevated rounded-lg px-1 py-2 text-center text-text-primary border border-[var(--card-border)]"
                        />
                        <input
                          type="text"
                          placeholder="8 or 12-10-8"
                          value={set.reps}
                          onChange={(e) => updateSet(idx, 'reps', e.target.value)}
                          className="w-20 bg-surface-elevated rounded-lg px-2 py-2 text-center text-text-primary placeholder:text-text-tertiary border border-[var(--card-border)]"
                        />
                      </>
                    )}
                    {type === 'calisthenics' && (
                      <>
                        <input
                          type="number"
                          placeholder="kg"
                          value={set.weight_kg ?? ''}
                          onChange={(e) =>
                            updateSet(idx, 'weight_kg', e.target.value ? parseFloat(e.target.value) : null)
                          }
                          className="w-12 bg-surface-elevated rounded-lg px-1 py-2 text-center text-text-primary border border-[var(--card-border)]"
                        />
                        <input
                          type="number"
                          placeholder="sets"
                          min={1}
                          value={set.sets_count ?? ''}
                          onChange={(e) =>
                            updateSet(idx, 'sets_count', e.target.value ? parseInt(e.target.value, 10) : null)
                          }
                          className="w-12 bg-surface-elevated rounded-lg px-1 py-2 text-center text-text-primary border border-[var(--card-border)]"
                        />
                        <input
                          type="text"
                          placeholder="reps"
                          value={set.reps}
                          onChange={(e) => updateSet(idx, 'reps', e.target.value)}
                          className="w-20 bg-surface-elevated rounded-lg px-2 py-2 text-center text-text-primary placeholder:text-text-tertiary border border-[var(--card-border)]"
                        />
                      </>
                    )}
                    {type === 'tricking' && (
                      <input
                        type="text"
                        placeholder="reps"
                        value={set.reps}
                        onChange={(e) => updateSet(idx, 'reps', e.target.value)}
                        className="w-12 bg-surface-elevated rounded-lg px-1 py-2 text-center text-text-primary placeholder:text-text-tertiary border border-[var(--card-border)]"
                      />
                    )}
                    <button type="button" onClick={() => removeSet(idx)} className="px-3 py-2 text-text-tertiary">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-4 rounded-xl">
            <label className="text-text-secondary text-sm block mb-2">Come ti sentivi?</label>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map((m) => (
                <button
                  key={m.emoji}
                  type="button"
                  onClick={() => setMood(m.emoji)}
                  className={cn(
                    'w-12 h-12 rounded-button flex items-center justify-center text-xl transition-all',
                    mood === m.emoji
                      ? 'bg-[var(--accent-red)]/30 border-2 border-[var(--accent-red)]'
                      : 'bg-surface-elevated border border-separator'
                  )}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4 rounded-xl">
            <label className="text-text-secondary text-sm block mb-2">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opzionale"
              className="w-full bg-surface-elevated rounded-xl p-3 text-text-primary placeholder:text-text-tertiary border border-[var(--card-border)] min-h-[80px]"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={
              !mood ||
              isSubmitting ||
              durationNum <= 0 ||
              (isRunning ? kmNum <= 0 : !sets.some((s) => s.exercise.trim()))
            }
            className={cn(
              'btn w-full rounded-xl font-semibold py-4',
              mood && !isSubmitting
                ? 'bg-[var(--accent-red)] text-white'
                : 'bg-surface-elevated text-text-tertiary cursor-not-allowed'
            )}
          >
            {isSubmitting ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </form>
      </div>
    </main>
  );
}
