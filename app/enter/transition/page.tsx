'use client';

/**
 * Pagina transizione: animazione tunnel NFC che si allarga e porta alla home.
 * Usa window.location per forzare full page load → sessione fresca dal server.
 */
import { useEffect } from 'react';
import { NfcIcon } from '@/components/NfcIcon';

export default function EnterTransitionPage() {
  useEffect(() => {
    const t = setTimeout(() => {
      // Cache-busting: evita che il Service Worker restituisca /home in cache
      window.location.replace(`/home?t=${Date.now()}`);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-bg-primary overflow-hidden">
      {/* Anelli tunnel che si espandono */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full border-2 border-white/20 animate-nfc-tunnel-ring" />
        <div className="absolute w-32 h-32 rounded-full border-2 border-white/15 animate-nfc-tunnel-ring-2" />
        <div className="absolute w-32 h-32 rounded-full border-2 border-white/10 animate-nfc-tunnel-ring-3" />
      </div>
      {/* Icona NFC che si allarga stile tunnel */}
      <div className="relative animate-nfc-tunnel text-text-primary">
        <NfcIcon size={72} />
      </div>
    </div>
  );
}
