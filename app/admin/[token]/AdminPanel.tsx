/**
 * Pannello admin: form add membro, lista membri con rigenera token, deactivate, delete.
 * Mostra URL NFC per nuovo membro dopo add.
 */
'use client';

import { useState } from 'react';
import {
  addMember,
  regenerateToken,
  deactivateMember,
  deleteMember,
} from '@/lib/actions/admin';

type Member = {
  id: string;
  name: string;
  emoji: string;
  role: string;
  is_active: boolean;
  token: string;
  created_at: string;
};

export function AdminPanel({
  members,
  adminToken,
}: {
  members: Member[];
  adminToken: string;
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('👤');
  const [role, setRole] = useState<'admin' | 'member'>('member');

  const handleAdd = async () => {
    if (!name.trim()) return;
    const result = await addMember(name.trim(), emoji, role);
    if (result?.token) {
      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/enter/${result.token}`;
      alert(`Membro aggiunto!\n\nURL NFC:\n${url}`);
    }
    setName('');
    setEmoji('👤');
    window.location.reload();
  };

  const handleRegenerate = async (memberId: string) => {
    const result = await regenerateToken(memberId);
    if (result?.token) {
      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/enter/${result.token}`;
      alert(`Token rigenerato!\n\nNuovo URL NFC:\n${url}`);
    }
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      {/* Aggiungi membro */}
      <div className="card p-4">
        <h2 className="text-text-primary font-medium mb-4">Aggiungi membro</h2>
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome"
            className="w-full bg-surface-elevated rounded-button p-3 text-text-primary placeholder:text-text-tertiary border border-separator focus:outline-none"
          />
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="Emoji"
            className="w-full bg-surface-elevated rounded-button p-3 text-text-primary placeholder:text-text-tertiary border border-separator focus:outline-none"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
            className="w-full bg-surface-elevated rounded-button p-3 text-text-primary border border-separator"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="btn w-full bg-accent-blue text-white"
          >
            Aggiungi + genera URL NFC
          </button>
        </div>
      </div>

      {/* Lista membri */}
      <div>
        <h2 className="text-text-primary font-medium mb-4">Membri</h2>
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-primary font-medium">
                    {m.emoji} {m.name}
                  </p>
                  <p className="text-text-tertiary text-xs">
                    {m.role} · {m.is_active ? 'Attivo' : 'Disattivato'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRegenerate(m.id)}
                    className="px-3 py-1 rounded-lg text-xs bg-accent-orange/20 text-accent-orange"
                  >
                    Rigenera
                  </button>
                  {m.is_active ? (
                    <button
                      onClick={async () => {
                        await deactivateMember(m.id);
                        window.location.reload();
                      }}
                      className="px-3 py-1 rounded-lg text-xs bg-accent-red/20 text-accent-red"
                    >
                      Disattiva
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        if (confirm('Eliminare definitivamente?')) {
                          await deleteMember(m.id);
                          window.location.reload();
                        }
                      }}
                      className="px-3 py-1 rounded-lg text-xs bg-accent-red/20 text-accent-red"
                    >
                      Elimina
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
