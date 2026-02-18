/**
 * Progress: grafico volume, lista PR.
 */
import { getSession } from '@/lib/actions/auth';
import { GymProgressView } from './GymProgressView';
import { BackButton } from '@/components/BackButton';

export default async function GymProgressPage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <main className="min-h-dvh">
      <header className="flex items-center gap-3 px-5 pt-4 pb-2 safe-area-top">
        <BackButton href="/gym" />
        <h1 className="text-title font-bold text-text-primary flex-1" style={{ letterSpacing: '-0.04em' }}>
          Progress
        </h1>
      </header>

      <GymProgressView memberId={session.memberId} />
    </main>
  );
}
