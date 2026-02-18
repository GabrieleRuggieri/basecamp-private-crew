/**
 * Thoughts: form add pensiero (con mood tag, anonimo), feed pensieri.
 */
import { getSession } from '@/lib/actions/auth';
import { getThoughts } from '@/lib/actions/thoughts';
import { ThoughtsFeed } from './ThoughtsFeed';
import { AddThoughtForm } from './AddThoughtForm';

export default async function ThoughtsPage() {
  const session = await getSession();
  if (!session) return null;

  const thoughts = await getThoughts();

  return (
    <main className="min-h-dvh">
      <header className="px-5 pt-4 pb-2 safe-area-top">
        <h1 className="text-title font-bold text-text-primary" style={{ letterSpacing: '-0.04em' }}>
          Thoughts
        </h1>
      </header>

      <div className="px-5 pb-8">
        <AddThoughtForm memberId={session.memberId} />
        <ThoughtsFeed thoughts={thoughts} currentMemberId={session.memberId} />
      </div>
    </main>
  );
}
