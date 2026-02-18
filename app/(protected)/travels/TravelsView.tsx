/**
 * Vista Travels: toggle Visited/Wishlist, form add (BottomSheet), griglia viaggi.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addTravel } from '@/lib/actions/travels';
import { BottomSheet } from '@/components/BottomSheet';

type Travel = {
  id: string;
  title: string;
  location: string;
  country_emoji: string | null;
  status: 'visited' | 'wishlist';
  year: number | null;
  note: string | null;
};

type Filter = 'visited' | 'wishlist';

export function TravelsView({
  travels,
  memberId,
}: {
  travels: Travel[];
  memberId: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('visited');
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [countryEmoji, setCountryEmoji] = useState('');
  const [status, setStatus] = useState<'visited' | 'wishlist'>('wishlist');
  const [year, setYear] = useState('');
  const [note, setNote] = useState('');

  const filtered = travels.filter((t) => t.status === filter);

  const handleAdd = async () => {
    if (!title.trim() || !location.trim()) return;
    await addTravel(
      memberId,
      title.trim(),
      location.trim(),
      countryEmoji.trim() || null,
      status,
      year ? parseInt(year, 10) : null,
      note.trim() || null
    );
    setTitle('');
    setLocation('');
    setCountryEmoji('');
    setStatus('wishlist');
    setYear('');
    setNote('');
    setShowAdd(false);
    router.refresh();
  };

  return (
    <div className="px-5 pb-8">
      <div className="flex gap-1 p-1 bg-surface rounded-xl border border-[var(--card-border)] mb-5">
        <button
          onClick={() => setFilter('visited')}
          className={`flex-1 py-2.5 rounded-lg text-footnote font-medium transition-colors ${
            filter === 'visited'
              ? 'bg-surface-elevated text-text-primary'
              : 'text-text-tertiary'
          }`}
        >
          Visited
        </button>
        <button
          onClick={() => setFilter('wishlist')}
          className={`flex-1 py-2.5 rounded-lg text-footnote font-medium transition-colors ${
            filter === 'wishlist'
              ? 'bg-surface-elevated text-text-primary'
              : 'text-text-tertiary'
          }`}
        >
          Wishlist
        </button>
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="btn w-full bg-accent-blue/15 text-accent-blue rounded-xl border border-accent-blue/20 mb-5"
      >
        + Add travel
      </button>

      <div className="grid grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <p className="col-span-2 text-text-tertiary text-center py-8">
            Nessun viaggio
          </p>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className="card p-4 rounded-xl">
              <p className="text-text-primary font-medium">{t.title}</p>
              <p className="text-text-tertiary text-sm">
                {t.country_emoji && `${t.country_emoji} `}
                {t.location}
              </p>
              {t.year && (
                <p className="text-accent-green text-xs mt-1">{t.year}</p>
              )}
            </div>
          ))
        )}
      </div>

      <BottomSheet
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Aggiungi viaggio"
      >
        <div className="space-y-4">
          <div>
            <label className="text-text-secondary text-sm block mb-2">Titolo</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Tokyo 2024"
              className="w-full bg-surface-elevated rounded-xl p-3.5 text-body text-text-primary placeholder:text-text-tertiary border border-[var(--card-border)] focus:outline-none focus:border-accent-blue/50"
            />
          </div>
          <div>
            <label className="text-text-secondary text-sm block mb-2">Luogo</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="es. Tokyo"
              className="w-full bg-surface-elevated rounded-xl p-3.5 text-body text-text-primary placeholder:text-text-tertiary border border-[var(--card-border)] focus:outline-none focus:border-accent-blue/50"
            />
          </div>
          <div>
            <label className="text-text-secondary text-sm block mb-2">Emoji paese</label>
            <input
              type="text"
              value={countryEmoji}
              onChange={(e) => setCountryEmoji(e.target.value)}
              placeholder="es. 🇯🇵"
              className="w-full bg-surface-elevated rounded-xl p-3.5 text-body text-text-primary placeholder:text-text-tertiary border border-[var(--card-border)] focus:outline-none focus:border-accent-blue/50"
            />
          </div>
          <div>
            <label className="text-text-secondary text-sm block mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'visited' | 'wishlist')}
              className="w-full bg-surface-elevated rounded-xl p-3.5 text-body text-text-primary border border-[var(--card-border)]"
            >
              <option value="visited">Visited</option>
              <option value="wishlist">Wishlist</option>
            </select>
          </div>
          <div>
            <label className="text-text-secondary text-sm block mb-2">Anno</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="es. 2024"
              className="w-full bg-surface-elevated rounded-xl p-3.5 text-body text-text-primary placeholder:text-text-tertiary border border-[var(--card-border)] focus:outline-none focus:border-accent-blue/50"
            />
          </div>
          <div>
            <label className="text-text-secondary text-sm block mb-2">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opzionale"
              className="w-full bg-surface-elevated rounded-xl p-3.5 text-body text-text-primary placeholder:text-text-tertiary border border-[var(--card-border)] focus:outline-none focus:border-accent-blue/50"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!title.trim() || !location.trim()}
            className="btn w-full bg-accent-blue text-white rounded-xl"
          >
            Aggiungi
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
