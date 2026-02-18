/**
 * Moments: card con caption, gruppi per mese (cartelle), upload con titolo.
 */
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { uploadMoment } from '@/lib/actions/moments';

type Moment = {
  id: string;
  storage_path: string;
  caption: string | null;
  taken_at: string;
  imageUrl: string | null;
};

const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

function groupByMonth(moments: Moment[]): { key: string; label: string; items: Moment[] }[] {
  const groups = new Map<string, Moment[]>();
  for (const m of moments) {
    const d = new Date(m.taken_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => {
      const [y, mo] = key.split('-');
      const label = `${MONTHS[parseInt(mo, 10) - 1]} ${y}`;
      return { key, label, items };
    });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function MomentsGrid({
  moments,
  memberId,
}: {
  moments: Moment[];
  memberId: string;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Moment | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    const file = inputRef.current?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('caption', caption);
      await uploadMoment(memberId, formData);
      setPreview(null);
      setCaption('');
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const cancelPreview = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setCaption('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const groups = groupByMonth(moments);

  return (
    <div className="px-5 pb-24">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload: pulsante o form con preview + caption */}
      {!preview ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="btn w-full bg-accent-green/15 text-accent-green border border-accent-green/30 mb-6 rounded-xl"
        >
          + Aggiungi foto
        </button>
      ) : (
        <div className="card p-4 mb-6 space-y-3">
          <div className="aspect-video rounded-lg overflow-hidden bg-surface-elevated">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="w-full h-full object-cover" />
          </div>
          <input
            type="text"
            placeholder="Titolo o descrizione (opzionale)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-[var(--card-border)] text-text-primary placeholder:text-text-tertiary text-body focus:outline-none focus:ring-2 focus:ring-accent-green/50"
          />
          <div className="flex gap-2">
            <button
              onClick={cancelPreview}
              className="flex-1 py-3 rounded-lg border border-[var(--separator)] text-text-secondary"
            >
              Annulla
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 py-3 rounded-lg bg-accent-green text-white font-medium disabled:opacity-60"
            >
              {uploading ? 'Caricamento...' : 'Salva'}
            </button>
          </div>
        </div>
      )}

      {/* Griglia per mese (cartelle) */}
      {groups.length === 0 ? (
        <div className="py-16 text-center">
          <span className="text-4xl opacity-40">📷</span>
          <p className="text-text-tertiary mt-3 text-body">Nessun momento</p>
          <p className="text-text-tertiary text-footnote mt-1">Aggiungi la prima foto</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(({ key, label, items }) => (
            <section key={key}>
              <h2 className="text-footnote font-semibold text-text-tertiary uppercase tracking-wider mb-4">
                {label}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {items.map((m) => (
                  <MomentCard key={m.id} moment={m} onClick={() => setViewing(m)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Lightbox — visualizzazione foto a schermo intero */}
      {viewing && (
        <div
          className="fixed inset-0 z-[200] bg-black flex flex-col"
          onClick={() => setViewing(null)}
        >
          <button
            onClick={() => setViewing(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xl"
            aria-label="Chiudi"
          >
            ×
          </button>
          <div className="flex-1 flex items-center justify-center p-4 min-h-0" onClick={(e) => e.stopPropagation()}>
            {viewing.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={viewing.imageUrl}
                alt={viewing.caption || ''}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-text-tertiary">Immagine non disponibile</span>
            )}
          </div>
          <div className="p-4 safe-area-bottom bg-black/80 text-white" onClick={(e) => e.stopPropagation()}>
            {viewing.caption && <p className="text-body">{viewing.caption}</p>}
            <p className="text-footnote text-text-tertiary mt-1">{formatDate(viewing.taken_at)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MomentCard({ moment, onClick }: { moment: Moment; onClick: () => void }) {
  return (
    <article
      className="card overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="aspect-[4/3] overflow-hidden bg-surface-elevated">
        <MomentImage url={moment.imageUrl} />
      </div>
      <div className="p-3">
        {moment.caption ? (
          <p className="text-body text-text-primary line-clamp-2">{moment.caption}</p>
        ) : (
          <p className="text-footnote text-text-tertiary italic">Senza titolo</p>
        )}
        <p className="text-footnote text-text-tertiary mt-1">{formatDate(moment.taken_at)}</p>
      </div>
    </article>
  );
}

function MomentImage({ url }: { url: string | null }) {
  const [error, setError] = useState(false);

  if (error || !url) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-text-tertiary bg-surface-elevated">
        <span className="text-2xl opacity-50">📷</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      onError={() => setError(true)}
    />
  );
}
