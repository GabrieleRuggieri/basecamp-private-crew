/**
 * Crew: lista membri con attività (ultime 3 visibili, espandibile),
 * reazioni e commenti su ogni sessione.
 */
import { getSession } from '@/lib/actions/auth';
import { getCrewMembersWithSessions } from '@/lib/actions/training-crew';
import { getReactionsForTargets } from '@/lib/actions/reactions';
import { CrewMemberCardWithSessions } from '@/components/CrewMemberCardWithSessions';
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

  const members = await getCrewMembersWithSessions(type as TrainingType);
  const sessionIds = members.flatMap((m) => m.sessions.map((s) => s.id));
  const reactionsBySessionId = await getReactionsForTargets(
    'gym_session',
    sessionIds,
    session.memberId
  );

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

      <div className="px-5 space-y-3 pb-8">
        {members.length === 0 ? (
          <div className="card p-8 rounded-xl">
            <p className="text-subhead text-text-tertiary text-center">No members</p>
          </div>
        ) : (
          members.map((m) => (
            <CrewMemberCardWithSessions
              key={m.id}
              member={m}
              reactionsBySessionId={reactionsBySessionId}
              currentMemberId={session.memberId}
            />
          ))
        )}
      </div>
    </main>
  );
}
