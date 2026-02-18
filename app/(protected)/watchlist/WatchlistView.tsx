/**
 * Vista Watchlist: tab Want/Doing/Done, filtro tipo, form add, select status per item.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addWatchlistItem, updateWatchlistStatus } from '@/lib/actions/watchlist';
import { BottomSheet } from '@/components/BottomSheet';
import type { WatchlistItem } from '@/lib/types';

type Status = 'want' | 'doing' | 'done';
type TypeFilter = 'movie' | 'series' | 'book' | 'podcast' | 'other' | 'all';

export function WatchlistView({
  items,
  memberId,
}: {
  items: WatchlistItem[];
  memberId: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Status>('want');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TypeFilter>('movie');

  const filtered = items
    .filter((i) => i.status === tab)
    .filter((i) => typeFilter === 'all' || i.type === typeFilter);

  const handleAdd = async () => {
    if (!title.trim()) return;
    await addWatchlistItem(memberId, title.trim(), type === 'all' ? 'movie' : type as 'movie' | 'series' | 'book' | 'podcast' | 'other', 'want');
    setTitle('');
    setType('movie');
    setShowAdd(false);
    router.refresh();
  };

  const tabs: { id: Status; label: string }[] = [
    { id: 'want', label: 'Want' },
    { id: 'doing', label: 'Doing' },
    { id: 'done', label: 'Done' },
  ];

  return (
    <div className="px-6 pb-8">
      <div className="flex gap-2 p-1 bg-surface rounded-button mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              tab === t.id
                ? 'bg-accent-orange/20 text-accent-orange'
                : 'text-text-tertiary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(['all', 'movie', 'series', 'book', 'podcast', 'other'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap ${
              typeFilter === t
                ? 'bg-accent-orange/20 text-accent-orange'
                : 'bg-surface-elevated text-text-tertiary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="btn w-full bg-accent-orange/20 text-accent-orange mb-6"
      >
        + Add
      </button>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-text-tertiary text-center py-8">Nessun titolo</p>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="card p-4 flex justify-between items-center">
              <div>
                <p className="text-text-primary font-medium">{item.title}</p>
                {item.type && (
                  <span className="text-text-tertiary text-xs">{item.type}</span>
                )}
              </div>
              <select
                value={item.status}
                onChange={async (e) => {
                  await updateWatchlistStatus(item.id, e.target.value as Status);
                  router.refresh();
                }}
                className="bg-surface-elevated text-text-primary rounded-lg px-3 py-2 text-sm border border-separator"
              >
                <option value="want">Want</option>
                <option value="doing">Doing</option>
                <option value="done">Done</option>
              </select>
            </div>
          ))
        )}
      </div>

      <BottomSheet
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Aggiungi titolo"
      >
        <div className="space-y-4">
          <div>
            <label className="text-text-secondary text-sm block mb-2">Titolo</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Oppenheimer"
              className="w-full bg-surface-elevated rounded-button p-3 text-text-primary placeholder:text-text-tertiary border border-separator focus:outline-none"
            />
          </div>
          <div>
            <label className="text-text-secondary text-sm block mb-2">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TypeFilter)}
              className="w-full bg-surface-elevated rounded-button p-3 text-text-primary border border-separator"
            >
              <option value="movie">Movie</option>
              <option value="series">Series</option>
              <option value="book">Book</option>
              <option value="podcast">Podcast</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={!title.trim()}
            className="btn w-full bg-accent-orange text-white"
          >
            Aggiungi
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
