/**
 * Card singolo item del feed (thought o gym).
 * Mostra avatar, autore (o Anonimo), contenuto, data relativa (ora, 5m, 2h, 15 gen).
 */
import { MemberAvatar } from './MemberAvatar';
import type { FeedItem } from '@/lib/actions/feed';

export function FeedItemComponent({ item, index = 0 }: { item: FeedItem; index?: number }) {
  const author = item.author;
  const isAnonymous = item.type === 'thought' && (item.payload as { anonymous?: boolean })?.anonymous;

  return (
    <div
      className="card p-4 rounded-xl animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex gap-3">
        <MemberAvatar
          emoji={isAnonymous ? '?' : author?.emoji ?? '👤'}
          name={isAnonymous ? 'Anonimo' : author?.name ?? 'Unknown'}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="text-footnote text-text-tertiary mb-1.5">
            {isAnonymous ? 'Anonimo' : author?.name}
            <span className="text-text-tertiary/70 ml-1.5">
              {formatDate(item.created_at)}
            </span>
          </p>
          {item.type === 'thought' && item.content && (
            <p className="text-body text-text-primary leading-snug">{item.content}</p>
          )}
          {item.type === 'gym' && (
            <p className="text-body text-text-primary">
              Workout completato
              {(item.payload as { mood?: string })?.mood && (
                <span className="ml-1.5">{(item.payload as { mood: string }).mood}</span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'ora';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}
