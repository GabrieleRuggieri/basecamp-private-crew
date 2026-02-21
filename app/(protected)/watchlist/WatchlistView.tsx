/**
 * Vista Watchlist: tab Want/Doing/Done, filtro tipo, form add.
 * Design refactored — card, type badges, layout migliorato.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addWatchlistItem, updateWatchlistStatus } from '@/lib/actions/watchlist';
import { BottomSheet } from '@/components/BottomSheet';
import { Film, BookOpen, Mic2, Tv, Package, Plus } from 'lucide-react';
import type { WatchlistItem } from '@/lib/types';

type Status = 'want' | 'doing' | 'done';
type TypeFilter = 'movie' | 'series' | 'book' | 'podcast' | 'other' | 'all';

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Film }> = {
  movie: { label: 'Film', icon: Film },
  series: { label: 'Serie', icon: Tv },
  book: { label: 'Libro', icon: BookOpen },
  podcast: { label: 'Podcast', icon: Mic2 },
  other: { label: 'Altro', icon: Package },
};

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
    await addWatchlistItem(
      memberId,
      title.trim(),
      type === 'all' ? 'movie' : (type as 'movie' | 'series' | 'book' | 'podcast' | 'other'),
      'want'
    );
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

  const typeFilters: { id: TypeFilter; label: string }[] = [
    { id: 'all', label: 'Tutti' },
    { id: 'movie', label: 'Film' },
    { id: 'series', label: 'Serie' },
    { id: 'book', label: 'Libri' },
    { id: 'podcast', label: 'Podcast' },
    { id: 'other', label: 'Altro' },
  ];

  return (
    <div className="relative px-5 pb-8">
      {/* Tabs */}
      <div className="glass rounded-2xl border border-white/[0.06] p-1.5 mb-4">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-accent-orange/25 text-accent-orange'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {typeFilters.map((t) => (
          <button
            key={t.id}
            onClick={() => setTypeFilter(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              typeFilter === t.id
                ? 'bg-accent-orange/20 text-accent-orange'
                : 'bg-surface-elevated text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={() => setShowAdd(true)}
        className="btn w-full bg-accent-orange/15 text-accent-orange border border-accent-orange/30 rounded-xl mb-6 flex items-center justify-center gap-2 hover:bg-accent-orange/25 transition-colors"
      >
        <Plus size={20} strokeWidth={2} />
        Aggiungi titolo
      </button>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card p-10 rounded-2xl flex flex-col items-center justify-center text-center border-dashed border-2 border-white/10">
            <div className="w-14 h-14 rounded-full bg-surface-elevated flex items-center justify-center mb-4">
              <Film className="w-7 h-7 text-text-tertiary" />
            </div>
            <p className="text-subhead text-text-secondary font-medium">
              Nessun titolo
            </p>
            <p className="text-caption text-text-tertiary mt-2">
              Aggiungi film, serie o libri che vuoi vedere
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const typeConfig = item.type ? TYPE_CONFIG[item.type] : null;
            const TypeIcon = typeConfig?.icon ?? Package;

            return (
              <div
                key={item.id}
                className="card p-4 rounded-xl border-l-4 border-accent-orange/50"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-text-primary">
                      {item.title}
                    </p>
                    {item.type && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-caption text-text-tertiary">
                        <TypeIcon size={12} />
                        {TYPE_CONFIG[item.type]?.label ?? item.type}
                      </span>
                    )}
                  </div>
                  <select
                    value={item.status}
                    onChange={async (e) => {
                      await updateWatchlistStatus(item.id, e.target.value as Status);
                      router.refresh();
                    }}
                    className="bg-surface-elevated text-text-primary rounded-lg px-3 py-2 text-sm border border-[var(--card-border)] focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  >
                    <option value="want">Want</option>
                    <option value="doing">Doing</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomSheet isOpen={showAdd} onClose={() => setShowAdd(false)} title="Aggiungi titolo">
        <div className="space-y-4">
          <div>
            <label className="text-text-secondary text-sm block mb-2">Titolo</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Oppenheimer"
              className="w-full bg-surface-elevated rounded-xl p-3 text-text-primary placeholder:text-text-tertiary border border-[var(--card-border)] focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
            />
          </div>
          <div>
            <label className="text-text-secondary text-sm block mb-2">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TypeFilter)}
              className="w-full bg-surface-elevated rounded-xl p-3 text-text-primary border border-[var(--card-border)] focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
            >
              <option value="movie">Film</option>
              <option value="series">Serie</option>
              <option value="book">Libro</option>
              <option value="podcast">Podcast</option>
              <option value="other">Altro</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={!title.trim()}
            className="btn w-full bg-accent-orange text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Aggiungi
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
