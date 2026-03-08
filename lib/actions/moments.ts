/**
 * Server Actions per Moments (foto).
 * getMoments: lista momenti/album del membro con signed URLs.
 * uploadMoment: singola foto.
 * uploadMomentAlbum: più foto in una cartella (album).
 * memberId viene sempre letto da getSession() — mai accettato dal client.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { createId } from '@/lib/utils';
import { getSession } from '@/lib/actions/auth';

const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 365; // 1 anno

export type MomentWithUrl = {
  id: string;
  member_id: string;
  storage_path: string;
  caption: string | null;
  taken_at: string;
  album_id: string | null;
  position?: number;
  imageUrl: string | null;
};

export type MomentAlbum = {
  id: string;
  member_id: string;
  title: string | null;
  created_at: string;
  moments: MomentWithUrl[];
};

export type MomentItem = { type: 'single'; moment: MomentWithUrl } | { type: 'album'; album: MomentAlbum };

export async function getMoments(): Promise<MomentItem[]> {
  const { data: moments } = await supabase
    .from('moments')
    .select('id, member_id, storage_path, caption, taken_at, album_id, position')
    .order('taken_at', { ascending: false });

  if (!moments?.length) return [];

  const paths = moments.map((m) => m.storage_path);
  const { data: signedList } = await supabase.storage
    .from('moments')
    .createSignedUrls(paths, SIGNED_URL_EXPIRY);

  const urlByPath = new Map((signedList ?? []).map((s) => [s.path, s.signedUrl]));

  const withUrls = moments.map((m) => ({
    ...m,
    imageUrl: urlByPath.get(m.storage_path) ?? null,
  })) as MomentWithUrl[];

  const albumIds = [...new Set(withUrls.map((m) => m.album_id).filter(Boolean))] as string[];
  const albumsMap = new Map<string, { member_id: string; title: string | null; created_at: string }>();
  if (albumIds.length > 0) {
    const { data: albums } = await supabase
      .from('moment_albums')
      .select('id, member_id, title, created_at')
      .in('id', albumIds);
    for (const a of albums ?? []) {
      albumsMap.set(a.id, { member_id: a.member_id, title: a.title, created_at: a.created_at });
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
          member_id: info?.member_id ?? m.member_id,
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

export async function uploadMoment(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Non autenticato');

  const file = formData.get('file') as File | null;
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Invalid file');
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${session.memberId}/${createId()}.${ext}`;

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
    member_id: session.memberId,
    storage_path: path,
    caption,
  });

  if (insertError) {
    console.error('createMoment', insertError);
    throw insertError;
  }
  revalidatePath('/moments');
  revalidatePath('/home');
}

export async function uploadMomentAlbum(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error('Non autenticato');

  const files = formData.getAll('files') as File[];
  const validFiles = files.filter((f) => f && f.type?.startsWith('image/'));
  const title = (formData.get('title') as string)?.trim() || null;

  if (validFiles.length === 0) throw new Error('Nessuna immagine valida');

  const { data: album, error: albumError } = await supabase
    .from('moment_albums')
    .insert({ member_id: session.memberId, title })
    .select('id')
    .single();

  if (albumError || !album) {
    console.error('uploadMomentAlbum', albumError);
    throw albumError ?? new Error('Errore creazione album');
  }

  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${session.memberId}/${createId()}.${ext}`;
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
      member_id: session.memberId,
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
  revalidatePath('/home');
}

export async function addPhotosToAlbum(
  albumId: string,
  formData: FormData
): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error('Non autenticato');

  const files = formData.getAll('files') as File[];
  const validFiles = files.filter((f) => f && f.type?.startsWith('image/'));
  if (validFiles.length === 0) throw new Error('Nessuna immagine valida');

  const { data: album } = await supabase
    .from('moment_albums')
    .select('member_id')
    .eq('id', albumId)
    .single();
  if (!album || album.member_id !== session.memberId) {
    throw new Error('Non puoi aggiungere foto a questo album');
  }

  const { data: existing } = await supabase
    .from('moments')
    .select('position')
    .eq('album_id', albumId)
    .order('position', { ascending: false })
    .limit(1);

  const startPosition = (existing?.[0]?.position ?? -1) + 1;

  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${session.memberId}/${createId()}.${ext}`;
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('moments')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('addPhotosToAlbum', uploadError);
      throw uploadError;
    }

    const { error: insertError } = await supabase.from('moments').insert({
      member_id: session.memberId,
      album_id: albumId,
      position: startPosition + i,
      storage_path: path,
    });

    if (insertError) {
      console.error('addPhotosToAlbum insert', insertError);
      throw insertError;
    }
  }

  revalidatePath('/moments');
  revalidatePath('/home');
}

export async function updateMomentCaption(momentId: string, caption: string | null): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Non autenticato' };

  const { data, error } = await supabase
    .from('moments')
    .update({ caption: caption?.trim() || null })
    .eq('id', momentId)
    .eq('member_id', session.memberId)
    .select('id')
    .single();

  if (error) {
    console.error('updateMomentCaption', error);
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: 'Non autorizzato' };

  revalidatePath('/moments');
  revalidatePath('/home');
  return { ok: true };
}

export async function updateAlbumTitle(albumId: string, title: string | null): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Non autenticato' };

  const { data, error } = await supabase
    .from('moment_albums')
    .update({ title: title?.trim() || null })
    .eq('id', albumId)
    .eq('member_id', session.memberId)
    .select('id')
    .single();

  if (error) {
    console.error('updateAlbumTitle', error);
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: 'Non autorizzato' };

  revalidatePath('/moments');
  revalidatePath('/home');
  return { ok: true };
}
