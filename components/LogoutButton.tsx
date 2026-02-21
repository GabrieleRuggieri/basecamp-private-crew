/**
 * Pulsante logout: link a /api/logout che distrugge il cookie e redirect a /.
 * Usa Route Handler invece di Server Action perché redirect() sovrascrive i cookie.
 * <a> per full page load così il browser riceve correttamente Set-Cookie.
 */
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  return (
    <a
      href="/api/logout"
      className="w-9 h-9 flex items-center justify-center text-text-tertiary hover:text-text-secondary rounded-lg transition-colors tap-target"
      aria-label="Logout"
    >
      <LogOut size={20} strokeWidth={1.75} />
    </a>
  );
}
