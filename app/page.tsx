/**
 * Landing page: titolo BASECAMP, animazione NFC.
 * In prod: accesso solo tramite tag NFC con URL https://[domain]/enter/[token]
 *
 * Per ritestare in dev: decommentare il blocco sotto e impostare DEV_NFC_TOKEN in .env
 */
import Link from 'next/link';
import { NfcIcon } from '@/components/NfcIcon';

export default function LandingPage() {
  // --- DEV: decommentare per simulare NFC senza tag fisico ---
  // const devToken = process.env.DEV_NFC_TOKEN;

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-bg-primary px-8 animate-fade-in">
      <div className="flex flex-col items-center justify-center gap-14 text-center">
        <h1
          className="text-display font-bold text-text-primary"
          style={{ letterSpacing: '-0.06em' }}
        >
          BASECAMP
        </h1>
        {/* Animazione NFC — pulse + ripple */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full border-2 border-text-tertiary/30 animate-nfc-pulse" />
          <div className="absolute w-28 h-28 rounded-full border border-text-tertiary/20 animate-nfc-pulse" style={{ animationDelay: '0.3s' }} />
          <div className="relative text-text-primary">
            <NfcIcon size={56} className="animate-nfc-pulse" />
          </div>
        </div>
        <p className="text-body text-text-tertiary max-w-[280px] leading-relaxed">
          Avvicina il telefono al tag NFC
        </p>
        {/* --- DEV: decommentare per mostrare link "Simula NFC" (e in validate-token decommentare blocco DEV) --- */}
        {/* {devToken && (
          <Link
            href={`/enter/${devToken}`}
            className="text-footnote text-text-secondary hover:text-text-primary transition-colors duration-200 py-3 px-5 rounded-xl -m-2 tap-target active:scale-95"
          >
            Simula NFC (dev)
          </Link>
        )} */}
      </div>
    </main>
  );
}
