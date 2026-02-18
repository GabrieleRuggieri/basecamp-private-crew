/**
 * Moments: upload foto, griglia con signed URLs (bucket privato).
 */
import { getSession } from '@/lib/actions/auth';
import { getMoments } from '@/lib/actions/moments';
import { MomentsGrid } from '@/app/(protected)/moments/MomentsGrid';

export default async function MomentsPage() {
  const session = await getSession();
  if (!session) return null;

  const moments = await getMoments(session.memberId);

  return (
    <main className="min-h-dvh">
      <header className="px-5 pt-4 pb-2 safe-area-top">
        <h1 className="text-title font-bold text-text-primary" style={{ letterSpacing: '-0.04em' }}>
          Moments
        </h1>
      </header>

      <MomentsGrid moments={moments} memberId={session.memberId} />
    </main>
  );
}
