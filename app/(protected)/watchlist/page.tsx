/**
 * Watchlist: film/serie/libri con tab Want/Doing/Done, filtro tipo, form add.
 */
import { getWatchlist } from '@/lib/actions/watchlist';
import { WatchlistView } from './WatchlistView';

export default async function WatchlistPage() {
  const items = await getWatchlist();

  return (
    <main className="min-h-dvh relative overflow-hidden">
      <div className="absolute inset-0 home-hero-gradient pointer-events-none opacity-60" />
      <header className="relative px-5 pt-4 pb-2 safe-area-top">
        <h1
          className="text-title font-bold text-text-primary tracking-tight"
          style={{ letterSpacing: '-0.04em' }}
        >
          Watchlist
        </h1>
      </header>
      <WatchlistView items={items} />
    </main>
  );
}
