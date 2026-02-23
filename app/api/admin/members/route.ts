/**
 * API Admin: elenco membri con token NFC.
 * Uso: GET /api/admin/members?token=ADMIN_TOKEN
 */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const adminToken = searchParams.get('token');

  if (!adminToken) {
    return NextResponse.json(
      { error: 'Manca token admin. Uso: /api/admin/members?token=ADMIN_TOKEN' },
      { status: 400 }
    );
  }

  const { data: config } = await supabase
    .from('admin_config')
    .select('admin_token')
    .eq('admin_token', adminToken)
    .single();

  if (!config) {
    return NextResponse.json({ error: 'Token admin non valido' }, { status: 401 });
  }

  const { data: members, error } = await supabase
    .from('members')
    .select('name, token, emoji')
    .eq('is_active', true)
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    members: members?.map((m) => ({
      name: m.name,
      token: m.token,
      emoji: m.emoji,
      url: `/enter/${m.token}`,
    })),
  });
}
