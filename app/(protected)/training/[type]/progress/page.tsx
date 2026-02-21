/**
 * Progress: grafico volume, lista PR.
 * Supporta gym, tricking, calisthenics.
 */
import { getSession } from '@/lib/actions/auth';
import { TrainingProgressView } from '@/components/TrainingProgressView';
import { BackButton } from '@/components/BackButton';
import { notFound } from 'next/navigation';
import { isValidTrainingType } from '@/lib/constants';
import type { TrainingType } from '@/lib/actions/training';

export default async function TrainingProgressPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isValidTrainingType(type)) notFound();

  const session = await getSession();
  if (!session) return null;

  return (
    <main className="min-h-dvh">
      <header className="flex items-center gap-3 px-5 pt-4 pb-2 safe-area-top">
        <BackButton href={`/training/${type}`} />
        <h1
          className="text-title font-bold text-text-primary flex-1"
          style={{ letterSpacing: '-0.04em' }}
        >
          Progress
        </h1>
      </header>

      <TrainingProgressView memberId={session.memberId} type={type as TrainingType} />
    </main>
  );
}
