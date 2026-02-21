/**
 * Crew: lista membri con avatar, streak, PR count e sessioni.
 * Supporta gym, tricking, calisthenics.
 */
import { getSession } from '@/lib/actions/auth';
import { getCrewMembers } from '@/lib/actions/training-crew';
import { MemberAvatar } from '@/components/MemberAvatar';
import { BackButton } from '@/components/BackButton';
import { notFound } from 'next/navigation';
import { isValidTrainingType } from '@/lib/constants';
import type { TrainingType } from '@/lib/actions/training';

export default async function TrainingCrewPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isValidTrainingType(type)) notFound();

  const session = await getSession();
  if (!session) return null;

  const members = await getCrewMembers(type as TrainingType);

  return (
    <main className="min-h-dvh">
      <header className="flex items-center gap-3 px-5 pt-4 pb-2 safe-area-top">
        <BackButton href={`/training/${type}`} />
        <h1
          className="text-title font-bold text-text-primary flex-1"
          style={{ letterSpacing: '-0.04em' }}
        >
          Crew
        </h1>
      </header>

      <div className="px-5 space-y-3">
        {members.length === 0 ? (
          <div className="card p-8 rounded-xl">
            <p className="text-subhead text-text-tertiary text-center">Nessun membro</p>
          </div>
        ) : (
          members.map((m) => (
            <div key={m.id} className="card p-4 rounded-xl">
              <div className="flex items-center gap-4">
                <MemberAvatar emoji={m.emoji} name={m.name} size="lg" />
                <div>
                  <p className="text-subhead font-semibold text-text-primary">{m.name}</p>
                  <p className="text-footnote text-text-tertiary mt-0.5">
                    Streak: {m.streak ?? 0} · PR: {m.pr_count ?? 0} · Sessioni: {m.sessions_count ?? 0}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
