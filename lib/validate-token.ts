/**
 * Valida il token NFC e restituisce i dati del membro.
 * In prod (Vercel): solo token reali da members.
 * In dev (locale): accetta DEV_NFC_TOKEN per simulazione (usa primo membro attivo).
 */
import { supabase } from '@/lib/supabase';
import type { BasecampSession } from '@/lib/types';

const isDev = process.env.NODE_ENV === 'development';

export async function validateNfcToken(token: string): Promise<BasecampSession | null> {
  // Dev: simula NFC con DEV_NFC_TOKEN → primo membro attivo
  if (isDev) {
    const devToken = process.env.DEV_NFC_TOKEN;
    if (devToken && token === devToken) {
      const { data } = await supabase
        .from('members')
        .select('id, name, emoji, role')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      if (data) {
        return { memberId: data.id, name: data.name, emoji: data.emoji, role: data.role };
      }
      return null;
    }
  }

  // Prod: valida token reale (64 hex)
  if (!/^[a-fA-F0-9]{64}$/.test(token)) {
    return null;
  }

  const { data, error } = await supabase
    .from('members')
    .select('id, name, emoji, role')
    .eq('token', token)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  return {
    memberId: data.id,
    name: data.name,
    emoji: data.emoji,
    role: data.role,
  };
}
