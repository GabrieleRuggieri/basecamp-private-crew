/**
 * Workout session: timer, serie (esercizio/kg/reps), Finish con mood picker.
 */
import { getSession } from '@/lib/actions/auth';
import { GymSessionLogger } from './GymSessionLogger';
import { BackButton } from '@/components/BackButton';

export default async function GymSessionPage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <main className="min-h-dvh">
      <header className="flex items-center gap-3 px-5 pt-4 pb-2 safe-area-top">
        <BackButton href="/gym" />
        <h1 className="text-title font-bold text-text-primary flex-1" style={{ letterSpacing: '-0.04em' }}>
          Workout
        </h1>
      </header>

      <GymSessionLogger memberId={session.memberId} />
    </main>
  );
}
