/**
 * Gym: streak, Start Workout, leaderboard, ultime sessioni, link Progress e Crew.
 */
import { getSession } from '@/lib/actions/auth';
import Link from 'next/link';

export default async function GymPage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <main className="min-h-dvh">
      <header className="px-5 pt-4 pb-2 safe-area-top">
        <h1 className="text-title font-bold text-text-primary" style={{ letterSpacing: '-0.04em' }}>
          Gym
        </h1>
      </header>

      <div className="px-5 space-y-5">
        <div className="card p-5 rounded-xl">
          <p className="text-footnote text-text-tertiary">Streak</p>
          <p className="text-3xl font-bold text-text-primary mt-1">
            0
          </p>
          <p className="text-caption text-text-tertiary mt-0.5">giorni consecutivi</p>
        </div>

        <Link
          href="/gym/session"
          className="btn w-full bg-accent-red text-white rounded-xl font-semibold flex items-center justify-center"
        >
          Start Workout
        </Link>

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

        <div className="flex gap-3">
          <Link
            href="/gym/progress"
            className="flex-1 btn bg-surface-elevated text-text-primary rounded-xl border border-[var(--card-border)] flex items-center justify-center"
          >
            Progress
          </Link>
          <Link
            href="/gym/crew"
            className="flex-1 btn bg-surface-elevated text-text-primary rounded-xl border border-[var(--card-border)] flex items-center justify-center"
          >
            Crew
          </Link>
        </div>
      </div>
    </main>
  );
}
