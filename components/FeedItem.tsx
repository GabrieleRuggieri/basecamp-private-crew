/**
 * Card singolo item del feed (thought, gym, travel, watchlist, moment).
 */
import type React from 'react';
import { MemberAvatar } from './MemberAvatar';
import { Brain, Dumbbell, MapPin, BookOpen, Camera } from 'lucide-react';
import { TrickingIcon } from '@/components/icons/TrickingIcon';
import { CalisthenicsIcon } from '@/components/icons/CalisthenicsIcon';
import type { FeedItem } from '@/lib/actions/feed';

const TRAINING_LABELS: Record<string, { label: string; icon: React.ElementType; accent: string }> = {
  gym: { label: 'Gym', icon: Dumbbell, accent: 'accent-red' },
  tricking: { label: 'Tricking', icon: TrickingIcon, accent: 'accent-red' },
  calisthenics: { label: 'Calisthenics', icon: CalisthenicsIcon, accent: 'accent-red' },
};

export function FeedItemComponent({
  item,
  index = 0,
  compact = false,
}: {
  item: FeedItem;
  index?: number;
  compact?: boolean;
}) {
  const author = item.author;
  const isAnonymous = item.type === 'thought' && (item.payload as { anonymous?: boolean })?.anonymous;
  const isThought = item.type === 'thought';
  const isGym = item.type === 'gym';
  const isTravel = item.type === 'travel';
  const isWatchlist = item.type === 'watchlist';
  const isMoment = item.type === 'moment';
  const trainingType = (item.payload as { trainingType?: string })?.trainingType ?? 'gym';
  const trainingMeta = TRAINING_LABELS[trainingType] ?? TRAINING_LABELS.gym;
  const TrainingIcon = trainingMeta.icon;
  const imageUrl = (item.payload as { imageUrl?: string })?.imageUrl;

  return (
    <div
      className={`card rounded-xl animate-fade-in overflow-hidden ${
        compact ? 'p-3' : 'p-4'
      } ${isThought ? 'feed-card-thought' : isGym ? 'feed-card-gym' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={isMoment && imageUrl ? 'space-y-2' : `flex ${compact ? 'gap-2' : 'gap-4'}`}>
        {isMoment && imageUrl && (
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-elevated -mx-1 -mt-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={(item.content as string) || 'Moment'}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className={`flex ${compact ? 'gap-2' : 'gap-4'} flex-1 min-w-0`}>
          <MemberAvatar
            emoji={isAnonymous ? '?' : author?.emoji ?? '👤'}
            name={isAnonymous ? 'Anonimo' : author?.name ?? 'Unknown'}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-footnote font-medium text-text-primary">
                {isAnonymous ? 'Anonimo' : author?.name ?? 'Unknown'}
              </span>
              <span className="text-caption text-text-tertiary">
                {formatDate(item.created_at)}
              </span>
              {isThought && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-purple/15 text-accent-purple text-[11px] font-medium">
                  <Brain size={12} />
                  Thought
                </span>
              )}
              {isGym && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--${trainingMeta.accent})]/15`}
                  style={{ color: `var(--${trainingMeta.accent})` }}
                >
                  <TrainingIcon size={12} />
                  {trainingMeta.label}
                </span>
              )}
              {isTravel && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-blue/15 text-accent-blue text-[11px] font-medium">
                  <MapPin size={12} />
                  Travel
                </span>
              )}
              {isWatchlist && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-orange/15 text-accent-orange text-[11px] font-medium">
                  <BookOpen size={12} />
                  Watchlist
                </span>
              )}
              {isMoment && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-green/15 text-accent-green text-[11px] font-medium">
                  <Camera size={12} />
                  Moment
                </span>
              )}
            </div>
            {isThought && (
              <>
                {((item.payload as { tags?: string[] })?.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {((item.payload as { tags?: string[] })?.tags ?? []).map((tag) => (
                      <span key={tag} className="text-[11px] text-accent-purple">
                        #{tag.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}
                {item.content && (
                  <p
                    className={`text-text-primary leading-snug ${
                      compact ? 'text-footnote mt-1 line-clamp-2' : 'text-body mt-2'
                    }`}
                  >
                    {item.content}
                  </p>
                )}
              </>
            )}
            {isGym && (
              <p
                className={`text-text-primary ${compact ? 'text-footnote mt-1' : 'text-body mt-2'}`}
              >
                {trainingMeta.label} completato
                {(item.payload as { mood?: string })?.mood && (
                  <span className="ml-1.5">{(item.payload as { mood: string }).mood}</span>
                )}
              </p>
            )}
            {isTravel && (
              <p
                className={`text-text-primary ${compact ? 'text-footnote mt-1 line-clamp-2' : 'text-body mt-2'}`}
              >
                {item.content}
                {(item.payload as { country_emoji?: string })?.country_emoji && (
                  <span className="ml-1">{(item.payload as { country_emoji: string }).country_emoji}</span>
                )}
              </p>
            )}
            {isWatchlist && (
              <p
                className={`text-text-primary ${compact ? 'text-footnote mt-1 line-clamp-2' : 'text-body mt-2'}`}
              >
                {item.content}
              </p>
            )}
            {isMoment && item.content && (
              <p className={`text-text-primary text-footnote mt-1 line-clamp-2`}>
                {item.content}
              </p>
            )}
          </div>
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
