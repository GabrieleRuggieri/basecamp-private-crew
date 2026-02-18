/**
 * Progress view: tab PRs (lista), History (grafico volume), Stats (placeholder).
 * Recharts per il grafico volume nel tempo.
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
import { getGymPrs, getGymHistory } from '@/lib/actions/gym-progress';

type Tab = 'prs' | 'history' | 'stats';

export function GymProgressView({ memberId }: { memberId: string }) {
  const [tab, setTab] = useState<Tab>('prs');
  const [prs, setPrs] = useState<{ exercise: string; weight_kg: number; reps: number | null }[]>([]);
  const [history, setHistory] = useState<{ date: string; volume: number }[]>([]);

  useEffect(() => {
    getGymPrs(memberId).then(setPrs);
    getGymHistory(memberId).then(setHistory);
  }, [memberId]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'prs', label: 'PRs' },
    { id: 'history', label: 'History' },
    { id: 'stats', label: 'Stats' },
  ];

  return (
    <div className="px-6 pb-8">
      {/* Segmented control */}
      <div className="flex gap-2 p-1 bg-surface rounded-button mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-surface-elevated text-text-primary'
                : 'text-text-tertiary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'prs' && (
        <div className="space-y-3">
          {prs.length === 0 ? (
            <p className="text-text-tertiary text-center py-8">Nessun PR ancora</p>
          ) : (
            prs.map((pr) => (
              <div key={pr.exercise} className="card p-4">
                <p className="text-text-primary font-medium">{pr.exercise}</p>
                <p className="text-accent-red text-xl mt-1">
                  {pr.weight_kg} kg
                  {pr.reps != null && ` × ${pr.reps}`}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-text-secondary text-sm mb-4">Volume per giorno</h3>
            {history.length === 0 ? (
              <p className="text-text-tertiary text-sm">Nessun dato</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
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
                      stroke="var(--accent-red)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--accent-red)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
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
