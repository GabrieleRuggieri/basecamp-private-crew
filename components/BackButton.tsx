/**
 * Pulsante freccia indietro per pagine interne (es. gym/session → gym).
 */
'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export function BackButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center w-10 h-10 -ml-2 rounded-xl text-text-secondary hover:text-text-primary active:scale-95 transition-all tap-target"
      aria-label="Torna indietro"
    >
      <ChevronLeft size={28} strokeWidth={2} />
    </Link>
  );
}
