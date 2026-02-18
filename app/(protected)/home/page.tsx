/**
 * Home: Today's pulse (avatar crew attivi oggi), Feed unificato (thoughts + gym).
 */
import { getSession } from '@/lib/actions/auth';
import { getUnifiedFeed } from '@/lib/actions/feed';
import { getCrewActiveToday } from '@/lib/actions/crew';
import { MemberAvatar } from '@/components/MemberAvatar';
import { FeedItemComponent } from '@/components/FeedItem';
import { LogoutButton } from '@/components/LogoutButton';

export default async function HomePage() {
  const session = await getSession();
  if (!session) return null;

  const [feed, crewActive] = await Promise.all([
    getUnifiedFeed(),
    getCrewActiveToday(),
  ]);

  const pulseMembers = crewActive.length > 0 ? crewActive : [session];

  return (
    <main className="min-h-dvh">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2 safe-area-top">
        <h1
          className="text-title font-bold text-text-primary"
          style={{ letterSpacing: '-0.04em' }}
        >
          BASECAMP
        </h1>
        <div className="flex items-center gap-2">
          <LogoutButton />
          <MemberAvatar emoji={session.emoji} name={session.name} size="sm" />
        </div>
      </header>

      {/* Today&apos;s pulse */}
      <section className="px-5 pt-6 pb-4">
        <p className="section-title mb-4">Today&apos;s pulse</p>
        <div className="flex gap-6 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-hide">
          {pulseMembers.map((m) => (
            <div key={'id' in m ? m.id : m.memberId} className="flex-shrink-0 flex flex-col items-center">
              <MemberAvatar
                emoji={m.emoji}
                name={m.name}
                size="md"
                showRing={crewActive.length > 0}
                ringColor="var(--accent-green)"
              />
              <p className="text-caption text-text-tertiary mt-2 truncate max-w-[56px] text-center">
                {m.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Feed */}
      <section className="px-5 pt-2 pb-6">
        <p className="section-title mb-4">Feed</p>
        <div className="space-y-3">
          {feed.length === 0 ? (
            <div className="card p-8 rounded-xl flex flex-col items-center justify-center text-center">
              <p className="text-subhead text-text-tertiary">
                Nessun post ancora
              </p>
              <p className="text-caption text-text-tertiary mt-2">
                Inizia da Thoughts o Gym
              </p>
            </div>
          ) : (
            feed.map((item, i) => (
              <FeedItemComponent key={`${item.type}-${item.id}`} item={item} index={i} />
            ))
          )}
        </div>
      </section>
    </main>
  );
}
