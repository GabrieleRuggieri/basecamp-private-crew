/**
 * Pulsante logout: icona LogOut, chiama logout() e redirect a /.
 */
'use client';

import { logout } from '@/lib/actions/auth';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  return (
    <button
      onClick={() => logout()}
      className="p-2 -m-2 text-text-tertiary hover:text-text-secondary rounded-lg transition-colors tap-target"
      aria-label="Logout"
    >
      <LogOut size={20} strokeWidth={1.75} />
    </button>
  );
}
