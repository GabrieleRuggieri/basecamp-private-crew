/**
 * Admin: accesso con admin_token da admin_config.
 * Lista membri, add, genera URL NFC, rigenera token. notFound se token invalido.
 */
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AdminPanel } from './AdminPanel';

type Props = {
  params: Promise<{ token: string }>;
};

export default async function AdminPage({ params }: Props) {
  const { token } = await params;

  const { data: config } = await supabase
    .from('admin_config')
    .select('id')
    .eq('admin_token', token)
    .single();

  if (!config) {
    notFound();
  }

  const { data: members } = await supabase
    .from('members')
    .select('id, name, emoji, role, is_active, token, created_at')
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-dvh bg-bg-primary p-6">
      <h1 className="font-mono text-text-tertiary text-lg mb-6">Admin</h1>
      <AdminPanel
        members={members ?? []}
        adminToken={token}
      />
    </main>
  );
}
