/**
 * Logger sessione running: crea sessione al mount, timer automatico,
 * input km, pace calcolata in tempo reale, Finish con mood picker e note.
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BottomSheet } from '@/components/BottomSheet';
import { addRunningSession, finishRunningSession } from '@/lib/actions/running';
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

export function RunningSessionLogger({
  backHref = '/training/running',
}: {
  backHref?: string;
}) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [km, setKm] = useState('');
  const [showFinishSheet, setShowFinishSheet] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    addRunningSession().then((id) => {
      if (id) setSessionId(id);
      else setSessionError(true);
    });
  }, []);

  useEffect(() => {
    if (showFinishSheet) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [showFinishSheet]);

  const kmValue = parseFloat(km) || 0;
  const paceDisplay = calcPace(elapsed, kmValue);

  const handleFinish = async () => {
    if (!sessionId || !mood || kmValue <= 0) return;
    setIsFinishing(true);
    const paceFloat = calcPaceFloat(elapsed, kmValue);
    const durationMinutes = Math.ceil(elapsed / 60);
    await finishRunningSession(sessionId, kmValue, paceFloat, mood, note, durationMinutes);
    setShowFinishSheet(false);
    router.push(backHref);
  };

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
        {sessionError ? (
          <>
            <p className="text-text-primary font-medium">Errore sessione</p>
            <p className="text-text-tertiary text-sm mt-2">
              Esci e rientra. Se il problema persiste esegui supabase/08-add-running.sql
            </p>
          </>
        ) : (
          <p className="text-text-tertiary">Caricamento...</p>
        )}
      </div>
    );
  }

  return (
    <div className="px-6 pb-8 space-y-4">
      {/* Timer */}
      <div className="card p-5 rounded-xl">
        <p className="text-text-tertiary text-sm mb-1">Tempo</p>
        <p className="text-4xl font-mono text-text-primary">{formatTime(elapsed)}</p>
      </div>

      {/* km input + pace */}
      <div className="card p-5 rounded-xl space-y-4">
        <div>
          <label className="text-text-tertiary text-sm block mb-2">Km percorsi</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={km}
              onChange={(e) => setKm(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-3xl font-mono text-text-primary placeholder:text-text-tertiary border-b border-separator pb-2 focus:outline-none focus:border-accent-red"
            />
            <span className="text-text-tertiary text-lg font-medium">km</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-separator">
          <p className="text-text-tertiary text-sm">Pace attuale</p>
          <p className="text-text-primary font-mono text-lg">
            {paceDisplay} <span className="text-text-tertiary text-sm">/km</span>
          </p>
        </div>
      </div>

      <button
        onClick={() => setShowFinishSheet(true)}
        className="btn w-full mt-4 text-white rounded-xl font-semibold flex items-center justify-center py-4"
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
          {/* Riepilogo */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-3 rounded-xl text-center">
              <p className="text-text-tertiary text-xs mb-1">Tempo</p>
              <p className="text-text-primary font-mono text-sm">{formatTime(elapsed)}</p>
            </div>
            <div className="card p-3 rounded-xl text-center">
              <p className="text-text-tertiary text-xs mb-1">Km</p>
              <p className="text-text-primary font-mono text-sm">{kmValue > 0 ? kmValue.toFixed(2) : '--'}</p>
            </div>
            <div className="card p-3 rounded-xl text-center">
              <p className="text-text-tertiary text-xs mb-1">Pace</p>
              <p className="text-text-primary font-mono text-sm">{paceDisplay}/km</p>
            </div>
          </div>

          {kmValue <= 0 && (
            <p className="text-accent-red text-sm text-center">Inserisci i km prima di finire</p>
          )}

          {/* Mood */}
          <div className="flex gap-3 flex-wrap justify-center">
            {MOODS.map((m) => (
              <button
                key={m.emoji}
                onClick={() => setMood(m.emoji)}
                className={cn(
                  'w-14 h-14 rounded-button flex items-center justify-center text-2xl transition-all',
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
            disabled={!mood || isFinishing || kmValue <= 0}
            className={cn(
              'btn w-full rounded-xl',
              mood && !isFinishing && kmValue > 0
                ? 'bg-accent-red text-white'
                : 'bg-surface-elevated text-text-tertiary cursor-not-allowed'
            )}
          >
            {isFinishing ? 'Salvataggio...' : 'Conferma'}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
