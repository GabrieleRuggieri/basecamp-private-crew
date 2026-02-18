/**
 * Wrapper per animazione fade-in al cambio pagina.
 * Usa pathname come key per ri-animare quando si naviga.
 */
'use client';

import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-content">
      {children}
    </div>
  );
}
