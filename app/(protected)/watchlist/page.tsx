/**
 * Watchlist: film/serie/libri con tab Want/Doing/Done, filtro tipo, form add.
 */
import { getSession } from '@/lib/actions/auth';
import { getWatchlist } from '@/lib/actions/watchlist';
import { WatchlistView } from './WatchlistView';

export default async function WatchlistPage() {
  const session = await getSession();
  if (!session) return null;

  const items = await getWatchlist(session.memberId);

  return (
    <main className="min-h-dvh">
      <header className="px-5 pt-4 pb-2 safe-area-top">
        <h1 className="text-title font-bold text-text-primary" style={{ letterSpacing: '-0.04em' }}>
          Watchlist
        </h1>
      </header>

      <WatchlistView items={items} memberId={session.memberId} />
    </main>
  );
}
