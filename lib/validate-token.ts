/**
 * Valida il token NFC e restituisce i dati del membro.
 * In prod: cerca il membro con token corrispondente in members (nfc_token).
 *
 * Per ritestare in dev: decommentare il blocco DEV_NFC_TOKEN sotto e impostare
 * DEV_NFC_TOKEN in .env (usa il token da /admin per simulare).
 */
import { supabase } from '@/lib/supabase';
import type { BasecampSession } from '@/lib/types';

export async function validateNfcToken(token: string): Promise<BasecampSession | null> {
  // --- DEV: decommentare per accettare DEV_NFC_TOKEN e usare primo membro dal DB ---
  // const devToken = process.env.DEV_NFC_TOKEN;
  // if (devToken && token === devToken) {
  //   const { data } = await supabase
  //     .from('members')
  //     .select('id, name, emoji, role')
  //     .eq('is_active', true)
  //     .order('created_at', { ascending: true })
  //     .limit(1)
  //     .single();
  //   if (data) {
  //     return { memberId: data.id, name: data.name, emoji: data.emoji, role: data.role };
  //   }
  //   return null;
  // }

  // --- PROD: commentare questo blocco per testare in dev (decommentare blocco DEV sopra) ---
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
