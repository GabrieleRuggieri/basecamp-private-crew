/**
 * Server Actions per Moments (foto).
 * getMoments: lista momenti del membro con signed URLs (bucket privato).
 * uploadMoment: carica immagine su Storage, crea record in DB.
 * Signed URLs: validità 1 anno, bucket resta privato.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { createId } from '@/lib/utils';

const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 365; // 1 anno — foto visibili finché non eliminate

export async function getMoments(memberId: string) {
  const { data } = await supabase
    .from('moments')
    .select('id, storage_path, caption, taken_at')
    .eq('member_id', memberId)
    .order('taken_at', { ascending: false });

  if (!data?.length) return [];

  // Signed URLs: bucket resta privato, accesso temporaneo
  const withUrls = await Promise.all(
    data.map(async (m) => {
      const { data: signed } = await supabase.storage
        .from('moments')
        .createSignedUrl(m.storage_path, SIGNED_URL_EXPIRY);
      return { ...m, imageUrl: signed?.signedUrl ?? null };
    })
  );
  return withUrls;
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

