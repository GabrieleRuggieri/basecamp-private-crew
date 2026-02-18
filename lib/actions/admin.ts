/**
 * Server Actions per pannello Admin (/admin/[token]).
 * addMember: crea membro, restituisce token NFC.
 * regenerateToken: rigenera token per un membro.
 * deactivateMember: disattiva membro (is_active=false).
 * deleteMember: elimina membro dal DB.
 */
'use server';

import { supabase } from '@/lib/supabase';

function generateToken(): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

export async function addMember(
  name: string,
  emoji: string,
  role: 'admin' | 'member'
): Promise<{ token: string } | null> {
  const { data, error } = await supabase
    .from('members')
    .insert({ name, emoji, role })
    .select('token')
    .single();

  if (error) {
    console.error('addMember', error);
    return null;
  }

  return { token: data.token };
}

export async function regenerateToken(
  memberId: string
): Promise<{ token: string } | null> {
  const token = generateToken();

  const { data, error } = await supabase
    .from('members')
    .update({ token })
    .eq('id', memberId)
    .select('token')
    .single();

  if (error) {
    console.error('regenerateToken', error);
    return null;
  }

  return { token: data.token };
}

export async function deactivateMember(memberId: string) {
  const { error } = await supabase
    .from('members')
    .update({ is_active: false })
    .eq('id', memberId);
  if (error) console.error('deactivateMember', error);
}

export async function deleteMember(memberId: string) {
  const { error } = await supabase.from('members').delete().eq('id', memberId);
  if (error) console.error('deleteMember', error);
}
