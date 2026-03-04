/**
 * Moments: card con caption, album (cartelle) per raggruppare più foto.
 * Upload singola o multipla (album).
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { uploadMoment, uploadMomentAlbum, addPhotosToAlbum, type MomentItem, type MomentWithUrl } from '@/lib/actions/moments';
import { resizeImageForUpload } from '@/lib/image-utils';
import { BottomSheet } from '@/components/BottomSheet';

const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

function groupByMonth(items: MomentItem[]): { key: string; label: string; items: MomentItem[] }[] {
  const groups = new Map<string, MomentItem[]>();
  for (const item of items) {
    const d = new Date(item.type === 'album' ? item.album.created_at : item.moment.taken_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
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
}: {
  moments: MomentItem[];
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [viewing, setViewing] = useState<{ moments: MomentWithUrl[]; index: number } | null>(null);
  const [addToAlbum, setAddToAlbum] = useState<{ albumId: string; title: string } | null>(null);
  const [addToAlbumFiles, setAddToAlbumFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const addToAlbumInputRef = useRef<HTMLInputElement>(null);

  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = previewFiles.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [previewFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
    if (files.length > 0) {
      setPreviewFiles((prev) => [...prev, ...files]);
    }
    e.target.value = '';
  };

  const handleUpload = async () => {
    const files = previewFiles;
    if (files.length === 0) return;

    setUploading(true);
    try {
      if (files.length === 1) {
        const resized = await resizeImageForUpload(files[0]);
        const formData = new FormData();
        formData.set('file', resized);
        formData.set('caption', caption);
        await uploadMoment(formData);
      } else {
        const resized = await Promise.all(files.map((f) => resizeImageForUpload(f)));
        const formData = new FormData();
        resized.forEach((f) => formData.append('files', f));
        formData.set('title', caption);
        await uploadMomentAlbum(formData);
      }
      setPreviewFiles([]);
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
    setPreviewFiles([]);
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
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {previewFiles.length === 0 ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="btn w-full bg-accent-green/15 text-accent-green border border-accent-green/30 mb-6 rounded-xl"
        >
          + Aggiungi foto
        </button>
      ) : (
        <div className="card p-4 mb-6 space-y-3">
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {previewFiles.map((_, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-surface-elevated">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrls[i] ?? ''} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-[var(--separator)] text-text-tertiary flex items-center justify-center text-2xl hover:border-accent-green/50 hover:text-accent-green transition-colors"
              aria-label="Aggiungi altra foto"
            >
              +
            </button>
          </div>
          <p className="text-footnote text-text-tertiary">
            {previewFiles.length} {previewFiles.length === 1 ? 'foto' : 'foto'} —{' '}
            {previewFiles.length === 1 ? 'singola' : 'album (cartella)'}
          </p>
          <input
            type="text"
            placeholder={previewFiles.length === 1 ? 'Titolo (opzionale)' : 'Titolo album, es. Vacanza Grecia'}
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

      {groups.length === 0 ? (
        <div className="py-16 text-center">
          <span className="text-4xl opacity-40">📷</span>
          <p className="text-text-tertiary mt-3 text-body">Nessun momento</p>
          <p className="text-text-tertiary text-footnote mt-1">Aggiungi la prima foto o un album</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(({ key, label, items }) => (
            <section key={key}>
              <h2 className="text-footnote font-semibold text-text-tertiary uppercase tracking-wider mb-4">
                {label}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {items.map((item) =>
                  item.type === 'album' ? (
                    <AlbumCard
                      key={item.album.id}
                      album={item.album}
                      onPhotoClick={(index) => setViewing({ moments: item.album.moments, index })}
                      onAddPhotos={() => setAddToAlbum({ albumId: item.album.id, title: item.album.title ?? '' })}
                    />
                  ) : (
                    <MomentCard
                      key={item.moment.id}
                      moment={item.moment}
                      onClick={() => setViewing({ moments: [item.moment], index: 0 })}
                    />
                  )
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      <BottomSheet
        isOpen={!!addToAlbum}
        onClose={() => {
          setAddToAlbum(null);
          setAddToAlbumFiles([]);
          addToAlbumInputRef.current && (addToAlbumInputRef.current.value = '');
        }}
        title={addToAlbum ? `Aggiungi a "${addToAlbum.title || 'Album'}"` : undefined}
      >
        {addToAlbum && (
          <AddToAlbumForm
            albumId={addToAlbum.albumId}
            files={addToAlbumFiles}
            setFiles={setAddToAlbumFiles}
            inputRef={addToAlbumInputRef}
            onSuccess={() => {
              setAddToAlbum(null);
              setAddToAlbumFiles([]);
              addToAlbumInputRef.current && (addToAlbumInputRef.current.value = '');
              router.refresh();
            }}
            onCancel={() => setAddToAlbum(null)}
          />
        )}
      </BottomSheet>

      {viewing && (
        <Lightbox
          moments={viewing.moments}
          index={viewing.index}
          onClose={() => setViewing(null)}
          onIndexChange={(i) => setViewing((v) => (v ? { ...v, index: i } : null))}
        />
      )}
    </div>
  );
}

function AddToAlbumForm({
  albumId,
  files,
  setFiles,
  inputRef,
  onSuccess,
  onCancel,
}: {
  albumId: string;
  files: File[];
  setFiles: (f: File[]) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
    if (newFiles.length) setFiles([...files, ...newFiles]);
    e.target.value = '';
  };

  const handleAdd = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const resized = await Promise.all(files.map((f) => resizeImageForUpload(f)));
      const formData = new FormData();
      resized.forEach((f) => formData.append('files', f));
      await addPhotosToAlbum(albumId, formData);
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="file"
        accept="image/*"
        multiple
        onChange={handleSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full py-3 rounded-lg border-2 border-dashed border-accent-green/50 text-accent-green flex items-center justify-center gap-2"
      >
        + Scegli foto
      </button>
      {files.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {files.map((_, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-surface-elevated relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrls[i]} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-sm flex items-center justify-center"
                  aria-label="Rimuovi"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <p className="text-footnote text-text-tertiary">{files.length} foto selezionate</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-lg border border-[var(--separator)] text-text-secondary"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={uploading}
              className="flex-1 py-3 rounded-lg bg-accent-green text-white font-medium disabled:opacity-60"
            >
              {uploading ? 'Caricamento...' : 'Aggiungi'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function AlbumCard({
  album,
  onPhotoClick,
  onAddPhotos,
}: {
  album: { id: string; member_id: string; title: string | null; created_at: string; moments: MomentWithUrl[] };
  onPhotoClick: (index: number) => void;
  onAddPhotos: () => void;
}) {
  const firstPhoto = album.moments[0];

  return (
    <article className="card overflow-hidden group">
      <div
        className="aspect-[4/3] overflow-hidden bg-surface-elevated relative cursor-pointer"
        onClick={() => onPhotoClick(0)}
      >
        <MomentImage url={firstPhoto.imageUrl} />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddPhotos();
          }}
          className="absolute top-2 right-2 z-10 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-black/60 text-white flex items-center justify-center text-xl active:bg-black/80 transition-colors touch-manipulation"
          aria-label="Aggiungi foto"
          title="Aggiungi foto"
        >
          +
        </button>
        {album.moments.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-footnote px-2 py-1 rounded">
            {album.moments.length} foto
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-body text-text-primary line-clamp-1">
          {album.title || `${album.moments.length} foto`}
        </p>
        <p className="text-footnote text-text-tertiary mt-0.5">{formatDate(album.created_at)}</p>
      </div>
    </article>
  );
}

function Lightbox({
  moments,
  index,
  onClose,
  onIndexChange,
}: {
  moments: MomentWithUrl[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const m = moments[index];
  const hasMultiple = moments.length > 1;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col" onClick={onClose}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xl"
        aria-label="Chiudi"
      >
        ×
      </button>
      <div className="flex-1 flex items-center justify-center p-4 min-h-0" onClick={(e) => e.stopPropagation()}>
        {m.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.imageUrl}
            alt={m.caption || ''}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-text-tertiary">Immagine non disponibile</span>
        )}
        {hasMultiple && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange((index - 1 + moments.length) % moments.length);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xl"
              aria-label="Precedente"
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange((index + 1) % moments.length);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xl"
              aria-label="Successiva"
            >
              ›
            </button>
          </>
        )}
      </div>
      <div className="p-4 safe-area-bottom bg-black/80 text-white" onClick={(e) => e.stopPropagation()}>
        {m.caption && <p className="text-body">{m.caption}</p>}
        <p className="text-footnote text-text-tertiary mt-1">
          {hasMultiple ? `${index + 1} / ${moments.length} · ` : ''}
          {formatDate(m.taken_at)}
        </p>
      </div>
    </div>
  );
}

function MomentCard({ moment, onClick }: { moment: MomentWithUrl; onClick: () => void }) {
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
