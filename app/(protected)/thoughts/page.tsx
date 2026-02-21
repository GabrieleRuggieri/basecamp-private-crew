/**
 * Thoughts: form add pensiero (con tags, anonimo), feed pensieri, filtro per tag.
 */
import { getSession } from '@/lib/actions/auth';
import { getThoughts, type ThoughtTag } from '@/lib/actions/thoughts';
import { getReactionsForTargets } from '@/lib/actions/reactions';
import { ThoughtsFeed } from './ThoughtsFeed';
import { AddThoughtForm } from './AddThoughtForm';
import { ThoughtTagFilter } from './ThoughtTagFilter';

export default async function ThoughtsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { tag } = await searchParams;
  const filterTag = tag && ['side_quest', 'riflessione', 'proposta'].includes(tag)
    ? (tag as ThoughtTag)
    : null;

  const thoughts = await getThoughts(filterTag);
  const thoughtIds = thoughts.map((t) => t.id);
  const reactionsMap = await getReactionsForTargets('thought', thoughtIds, session.memberId);

  return (
    <main className="min-h-dvh">
      <header className="px-5 pt-4 pb-2 safe-area-top">
        <h1 className="text-title font-bold text-text-primary" style={{ letterSpacing: '-0.04em' }}>
          Thoughts
        </h1>
      </header>

      <div className="px-5 pb-8">
        <AddThoughtForm memberId={session.memberId} />
        <ThoughtTagFilter currentTag={filterTag} />
        <ThoughtsFeed thoughts={thoughts} currentMemberId={session.memberId} reactionsMap={reactionsMap} />
      </div>
    </main>
  );
}
