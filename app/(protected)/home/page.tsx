/**
 * Home: hero welcome, Feed per sezioni (Thoughts, Training, Travels, Watchlist, Moments) con 2 item per riga.
 */
import { getSession } from '@/lib/actions/auth';
import { getUnifiedFeed } from '@/lib/actions/feed';
import { MemberAvatar } from '@/components/MemberAvatar';
import { FeedItemComponent } from '@/components/FeedItem';
import { LogoutButton } from '@/components/LogoutButton';
import { Brain, Dumbbell, MapPin, BookOpen, Camera } from 'lucide-react';
import Link from 'next/link';
import type { FeedItem } from '@/lib/actions/feed';

const SECTIONS = [
  { key: 'thoughts', href: '/thoughts', icon: Brain, accent: 'text-accent-purple', label: 'Thoughts' },
  { key: 'training', href: '/training', icon: Dumbbell, accent: 'text-accent-red', label: 'Training' },
  { key: 'travels', href: '/travels', icon: MapPin, accent: 'text-accent-blue', label: 'Travels' },
  { key: 'watchlist', href: '/watchlist', icon: BookOpen, accent: 'text-accent-orange', label: 'Watchlist' },
  { key: 'moments', href: '/moments', icon: Camera, accent: 'text-accent-green', label: 'Moments' },
] as const;

export default async function HomePage() {
  const session = await getSession();
  if (!session) return null;

  const feed = await getUnifiedFeed();
  const hasAny = SECTIONS.some((s) => (feed[s.key] as FeedItem[])?.length > 0);

  return (
    <main className="min-h-dvh relative overflow-hidden">
      {/* Hero gradient background */}
      <div className="absolute inset-0 home-hero-gradient pointer-events-none" />

      {/* Header */}
      <header className="relative flex items-center justify-between px-5 pt-4 pb-2 safe-area-top">
        <h1
          className="text-title font-bold text-text-primary tracking-tight"
          style={{ letterSpacing: '-0.04em' }}
        >
          BASECAMP
        </h1>
        <div className="flex items-center gap-2">
          <LogoutButton />
          <MemberAvatar emoji={session.emoji} name={session.name} size="sm" />
        </div>
      </header>

      {/* Hero welcome */}
      <section className="relative px-5 pt-4 pb-6">
        <p className="text-display font-bold text-text-primary leading-tight" style={{ letterSpacing: '-0.04em' }}>
          Ciao, {session.name}
        </p>
      </section>

      {/* Feed per sezioni */}
      <section className="relative px-5 pb-8">
        {!hasAny ? (
          <div className="card p-10 rounded-2xl flex flex-col items-center justify-center text-center border-dashed border-2 border-white/10">
            <div className="w-14 h-14 rounded-full bg-surface-elevated flex items-center justify-center mb-4">
              <Brain className="w-7 h-7 text-text-tertiary" />
            </div>
            <p className="text-subhead text-text-secondary font-medium">
              Nessun post ancora
            </p>
            <p className="text-caption text-text-tertiary mt-2">
              Inizia da Thoughts, Training, Travels, Watchlist o Moments
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {SECTIONS.map(({ key, href, icon: Icon, accent, label }) => {
              const items = (feed[key] ?? []) as FeedItem[];
              if (items.length === 0) return null;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className={`section-title flex items-center gap-2 ${accent}`}>
                      <Icon size={18} />
                      {label}
                    </h2>
                    <Link
                      href={href}
                      className="text-footnote text-text-tertiary hover:text-text-secondary"
                    >
                      Vedi tutti
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {items.slice(0, 3).map((item, i) => (
                      <FeedItemComponent
                        key={`${key}-${item.id}`}
                        item={item}
                        index={i}
                        compact
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
