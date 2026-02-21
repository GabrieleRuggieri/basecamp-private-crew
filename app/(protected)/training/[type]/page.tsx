/**
 * Training type page: gym, tricking, calisthenics.
 * Gym: streak, Start Workout, leaderboard, ultime sessioni, Progress, Crew.
 * Tricking/Calisthenics: streak, Start Session, Progress.
 */
import { getSession } from '@/lib/actions/auth';
import Link from 'next/link';
import { BackButton } from '@/components/BackButton';
import { notFound } from 'next/navigation';
import { isValidTrainingType } from '@/lib/constants';

const LABELS: Record<string, string> = {
  gym: 'Gym',
  tricking: 'Tricking',
  calisthenics: 'Calisthenics',
};

const SUBTITLES: Record<string, string> = {
  tricking: 'Parkour e acrobazie',
  calisthenics: 'Esercizi a corpo libero',
};

const SESSION_LABELS: Record<string, string> = {
  gym: 'Start Workout',
  tricking: 'Start Session',
  calisthenics: 'Start Session',
};

export default async function TrainingTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isValidTrainingType(type)) notFound();

  const session = await getSession();
  if (!session) return null;

  const subtitle = SUBTITLES[type];
  const sessionLabel = SESSION_LABELS[type];

  return (
    <main className="min-h-dvh">
      <header className="flex items-center gap-3 px-5 pt-4 pb-2 safe-area-top">
        <BackButton href="/training" />
        <h1
          className="text-title font-bold text-text-primary flex-1"
          style={{ letterSpacing: '-0.04em' }}
        >
          {LABELS[type]}
        </h1>
        {subtitle && (
          <p className="text-footnote text-text-tertiary mt-1">{subtitle}</p>
        )}
      </header>

      <div className="px-5 space-y-5">
        <div className="card p-5 rounded-xl">
          <p className="text-footnote text-text-tertiary">Streak</p>
          <p className="text-3xl font-bold text-text-primary mt-1">0</p>
          <p className="text-caption text-text-tertiary mt-0.5">giorni consecutivi</p>
        </div>

        <Link
          href={`/training/${type}/session`}
          className="btn w-full bg-accent-red text-white rounded-xl font-semibold flex items-center justify-center"
        >
          {sessionLabel}
        </Link>

        {type === 'gym' && (
          <>
            <div className="card p-5 rounded-xl">
              <h3 className="text-subhead font-semibold text-text-primary mb-2">
                Leaderboard settimana
              </h3>
              <p className="text-footnote text-text-tertiary">Nessun dato ancora</p>
            </div>

            <div className="card p-5 rounded-xl">
              <h3 className="text-subhead font-semibold text-text-primary mb-2">
                Ultime sessioni
              </h3>
              <p className="text-footnote text-text-tertiary">Nessuna sessione</p>
            </div>
          </>
        )}

        <div className="flex gap-3">
          <Link
            href={`/training/${type}/progress`}
            className="flex-1 btn bg-surface-elevated text-text-primary rounded-xl border border-[var(--card-border)] flex items-center justify-center"
          >
            Progress
          </Link>
          <Link
            href={`/training/${type}/crew`}
            className="flex-1 btn bg-surface-elevated text-text-primary rounded-xl border border-[var(--card-border)] flex items-center justify-center"
          >
            Crew
          </Link>
        </div>
      </div>
    </main>
  );
}
