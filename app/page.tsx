/**
 * Landing page: titolo BASECAMP, animazione NFC.
 * In prod (Vercel): accesso solo tramite tag NFC con URL https://[domain]/enter/[token]
 * In dev (locale): pulsante "Simula NFC" se DEV_NFC_TOKEN è in .env.local
 */
import { redirect } from 'next/navigation';
import { NfcIcon } from '@/components/NfcIcon';
import { getSession } from '@/lib/actions/auth';

const isDev = process.env.NODE_ENV === 'development';

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect('/home');

  const devToken = isDev ? process.env.DEV_NFC_TOKEN : undefined;

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-bg-primary px-8 animate-fade-in">
      <div className="flex flex-col items-center justify-center gap-14 text-center">
        <h1
          className="text-display font-bold text-text-primary"
          style={{ letterSpacing: '-0.06em' }}
        >
          BASECAMP
        </h1>
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
        {devToken && (
          <a
            href={`/enter/${devToken}`}
            className="btn px-8 py-3 bg-accent-blue/20 text-accent-blue border border-accent-blue/40 rounded-xl font-medium hover:bg-accent-blue/30 transition-colors inline-block"
          >
            Simula NFC
          </a>
        )}
      </div>
    </main>
  );
}
