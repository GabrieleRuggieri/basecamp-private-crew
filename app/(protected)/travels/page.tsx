/**
 * Travels: lista viaggi (visited/wishlist) con form add.
 */
import { getSession } from '@/lib/actions/auth';
import { getTravels } from '@/lib/actions/travels';
import { TravelsView } from './TravelsView';

export default async function TravelsPage() {
  const session = await getSession();
  if (!session) return null;

  const travels = await getTravels(session.memberId);

  return (
    <main className="min-h-dvh">
      <header className="px-5 pt-4 pb-2 safe-area-top">
        <h1 className="text-title font-bold text-text-primary" style={{ letterSpacing: '-0.04em' }}>
          Travels
        </h1>
      </header>

      <TravelsView
        travels={travels}
        memberId={session.memberId}
      />
    </main>
  );
}
