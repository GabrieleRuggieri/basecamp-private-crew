/**
 * Progress view: tab PRs (lista), History (grafico volume), Crew (progressi crew), Stats (placeholder).
 * Recharts per il grafico volume nel tempo.
 * Supporta gym, tricking, calisthenics.
 */
'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getGymPrs, getGymHistory, getCrewProgress, type CrewProgressMember } from '@/lib/actions/training-progress';
import { MemberAvatar } from '@/components/MemberAvatar';
import type { TrainingType } from '@/lib/actions/training';

type Tab = 'prs' | 'history' | 'crew' | 'stats';

const ACCENT_BY_TYPE: Record<TrainingType, string> = {
  gym: 'accent-red',
  tricking: 'accent-red',
  calisthenics: 'accent-red',
};

export function TrainingProgressView({
  memberId,
  type = 'gym',
}: {
  memberId: string;
  type?: TrainingType;
}) {
  const [tab, setTab] = useState<Tab>(type === 'tricking' ? 'history' : 'prs');
  const [prs, setPrs] = useState<
    { exercise: string; weight_kg: number | null; reps: number | null }[]
  >([]);
  const [history, setHistory] = useState<{
    volumeByDate: { date: string; volume: number }[];
    sessions: { id: string; date: string; duration_minutes: number }[];
  }>({ volumeByDate: [], sessions: [] });
  const [crew, setCrew] = useState<CrewProgressMember[]>([]);
  const accent = ACCENT_BY_TYPE[type];

  useEffect(() => {
    getGymPrs(memberId, type).then(setPrs);
    getGymHistory(memberId, type).then(setHistory);
    getCrewProgress(type).then(setCrew);
  }, [memberId, type]);

  useEffect(() => {
    if (type === 'tricking' && tab === 'prs') setTab('history');
  }, [type, tab]);

  const tabs: { id: Tab; label: string }[] =
    type === 'tricking'
      ? [
          { id: 'history', label: 'History' },
          { id: 'crew', label: 'Crew' },
          { id: 'stats', label: 'Stats' },
        ]
      : [
          { id: 'prs', label: 'PRs' },
          { id: 'history', label: 'History' },
          { id: 'crew', label: 'Crew' },
          { id: 'stats', label: 'Stats' },
        ];

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  return (
    <div className="px-6 pb-8">
      <div className="flex gap-2 p-1 bg-surface rounded-button mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-surface-elevated text-text-primary' : 'text-text-tertiary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'prs' && type !== 'tricking' && (
        <div className="space-y-3">
          {prs.length === 0 ? (
            <p className="text-text-tertiary text-center py-8">Nessun PR ancora</p>
          ) : (
            prs.map((pr) => (
              <div key={pr.exercise} className="card p-4">
                <p className="text-text-primary font-medium">{pr.exercise}</p>
                {(pr.weight_kg != null || pr.reps != null) && (
                  <p className={`text-xl mt-1 text-[var(--${accent})]`}>
                    {pr.weight_kg != null && `${pr.weight_kg} kg`}
                    {pr.weight_kg != null && pr.reps != null && ' × '}
                    {pr.reps != null && `${pr.reps} reps`}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-text-secondary text-sm mb-4">Sessioni</h3>
            {history.sessions.length === 0 ? (
              <p className="text-text-tertiary text-sm">Nessuna sessione</p>
            ) : (
              <div className="space-y-2">
                {history.sessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center py-2 border-b border-separator last:border-0"
                  >
                    <span className="text-text-primary text-sm">
                      {new Date(s.date).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className={`text-[var(--${accent})] font-medium`}>
                      {formatDuration(s.duration_minutes)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {type !== 'tricking' && history.volumeByDate.length > 0 && (
            <div className="card p-4">
              <h3 className="text-text-secondary text-sm mb-4">Volume per giorno</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history.volumeByDate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" />
                    <XAxis
                      dataKey="date"
                      stroke="var(--text-tertiary)"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis stroke="var(--text-tertiary)" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--surface-elevated)',
                        border: '1px solid var(--separator)',
                        borderRadius: 12,
                      }}
                      labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="volume"
                      stroke={`var(--${accent})`}
                      strokeWidth={2}
                      dot={{ fill: `var(--${accent})` }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'crew' && (
        <div className="space-y-3">
          <h3 className="text-text-secondary text-sm mb-2">Progressi crew</h3>
          {crew.length === 0 ? (
            <p className="text-text-tertiary text-sm py-6 text-center">Nessun membro</p>
          ) : (
            crew.map((m) => (
              <div key={m.id} className="card p-4 rounded-xl">
                <div className="flex items-center gap-4">
                  <MemberAvatar emoji={m.emoji} name={m.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-subhead font-semibold text-text-primary">{m.name}</p>
                    <p className="text-footnote text-text-tertiary mt-0.5">
                      {m.pr_count} PR · {m.sessions_count} sessioni
                    </p>
                  </div>
                </div>
                {m.prs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-separator space-y-2">
                    {m.prs.slice(0, 3).map((pr) => (
                      <div key={pr.exercise} className="flex justify-between text-sm">
                        <span className="text-text-secondary">{pr.exercise}</span>
                        <span className={`text-[var(--${accent})] font-medium`}>
                          {pr.weight_kg != null && `${pr.weight_kg} kg`}
                          {pr.weight_kg != null && pr.reps != null && ' × '}
                          {pr.reps != null && `${pr.reps} reps`}
                        </span>
                      </div>
                    ))}
                    {m.prs.length > 3 && (
                      <p className="text-text-tertiary text-xs">+{m.prs.length - 3} altri</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'stats' && (
        <div className="card p-4">
          <h3 className="text-text-secondary text-sm mb-4">Heatmap presenze</h3>
          <p className="text-text-tertiary text-sm">In arrivo...</p>
        </div>
      )}
    </div>
  );
}
