/**
 * Server Actions per Moments (foto).
 * getMoments: lista momenti/album del membro con signed URLs.
 * uploadMoment: singola foto.
 * uploadMomentAlbum: più foto in una cartella (album).
 */
'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { createId } from '@/lib/utils';

const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 365; // 1 anno

export type MomentWithUrl = {
  id: string;
  storage_path: string;
  caption: string | null;
  taken_at: string;
  album_id: string | null;
  position?: number;
  imageUrl: string | null;
};

export type MomentAlbum = {
  id: string;
  title: string | null;
  created_at: string;
  moments: MomentWithUrl[];
};

export type MomentItem = { type: 'single'; moment: MomentWithUrl } | { type: 'album'; album: MomentAlbum };

export async function getMoments(memberId: string): Promise<MomentItem[]> {
  const { data: moments } = await supabase
    .from('moments')
    .select('id, storage_path, caption, taken_at, album_id, position')
    .eq('member_id', memberId)
    .order('taken_at', { ascending: false });

  if (!moments?.length) return [];

  const withUrls = await Promise.all(
    moments.map(async (m) => {
      const { data: signed } = await supabase.storage
        .from('moments')
        .createSignedUrl(m.storage_path, SIGNED_URL_EXPIRY);
      return { ...m, imageUrl: signed?.signedUrl ?? null } as MomentWithUrl;
    })
  );

  const albumIds = [...new Set(withUrls.map((m) => m.album_id).filter(Boolean))] as string[];
  const albumsMap = new Map<string, { title: string | null; created_at: string }>();
  if (albumIds.length > 0) {
    const { data: albums } = await supabase
      .from('moment_albums')
      .select('id, title, created_at')
      .in('id', albumIds);
    for (const a of albums ?? []) {
      albumsMap.set(a.id, { title: a.title, created_at: a.created_at });
    }
  }

  const singles: MomentItem[] = [];
  const byAlbum = new Map<string, MomentWithUrl[]>();

  for (const m of withUrls) {
    if (m.album_id) {
      const list = byAlbum.get(m.album_id) ?? [];
      list.push(m);
      byAlbum.set(m.album_id, list);
    } else {
      singles.push({ type: 'single', moment: m });
    }
  }

  const result: MomentItem[] = [];
  const seenAlbums = new Set<string>();

  for (const m of withUrls) {
    if (m.album_id && !seenAlbums.has(m.album_id)) {
      seenAlbums.add(m.album_id);
      const info = albumsMap.get(m.album_id);
      const albumMoments = (byAlbum.get(m.album_id) ?? []).sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
      result.push({
        type: 'album',
        album: {
          id: m.album_id,
          title: info?.title ?? null,
          created_at: info?.created_at ?? m.taken_at,
          moments: albumMoments,
        },
      });
    }
  }

  for (const s of singles) {
    result.push(s);
  }

  result.sort((a, b) => {
    const dateA = a.type === 'album' ? a.album.created_at : a.moment.taken_at;
    const dateB = b.type === 'album' ? b.album.created_at : b.moment.taken_at;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return result;
}

export async function uploadMoment(memberId: string, formData: FormData) {
  const file = formData.get('file') as File | null;
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Invalid file');
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${memberId}/${createId()}.${ext}`;

  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('moments')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('uploadMoment', uploadError);
    throw uploadError;
  }

  const caption = (formData.get('caption') as string)?.trim() || null;

  const { error: insertError } = await supabase.from('moments').insert({
    member_id: memberId,
    storage_path: path,
    caption,
  });

  if (insertError) {
    console.error('createMoment', insertError);
    throw insertError;
  }
  revalidatePath('/moments');
}

export async function uploadMomentAlbum(memberId: string, formData: FormData): Promise<void> {
  const files = formData.getAll('files') as File[];
  const validFiles = files.filter((f) => f && f.type?.startsWith('image/'));
  const title = (formData.get('title') as string)?.trim() || null;

  if (validFiles.length === 0) throw new Error('Nessuna immagine valida');

  const { data: album, error: albumError } = await supabase
    .from('moment_albums')
    .insert({ member_id: memberId, title })
    .select('id')
    .single();

  if (albumError || !album) {
    console.error('uploadMomentAlbum', albumError);
    throw albumError ?? new Error('Errore creazione album');
  }

  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${memberId}/${createId()}.${ext}`;
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('moments')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('uploadMomentAlbum', uploadError);
      throw uploadError;
    }

    const { error: insertError } = await supabase.from('moments').insert({
      member_id: memberId,
      album_id: album.id,
      position: i,
      storage_path: path,
    });

    if (insertError) {
      console.error('uploadMomentAlbum insert', insertError);
      throw insertError;
    }
  }

  revalidatePath('/moments');
}
