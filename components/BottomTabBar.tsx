/**
 * Tab bar fissata in basso: Home, Gym, Travels, Thoughts, Watchlist, Moments.
 * Evidenzia la tab attiva con colore accent. Glass effect.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Dumbbell,
  Plane,
  Brain,
  Tv,
  Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/home', icon: Home, label: 'Home', section: null },
  { href: '/gym', icon: Dumbbell, label: 'Gym', section: 'gym' },
  { href: '/travels', icon: Plane, label: 'Travels', section: 'travels' },
  { href: '/thoughts', icon: Brain, label: 'Thoughts', section: 'thoughts' },
  { href: '/watchlist', icon: Tv, label: 'Watchlist', section: 'watchlist' },
  { href: '/moments', icon: Camera, label: 'Moments', section: 'moments' },
] as const;

const SECTION_COLORS: Record<string, string> = {
  gym: 'text-accent-red',
  travels: 'text-accent-blue',
  thoughts: 'text-accent-purple',
  watchlist: 'text-accent-orange',
  moments: 'text-accent-green',
};

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-30',
        'glass border-t border-[var(--card-border)]',
        'safe-area-bottom',
        'flex items-center justify-around py-1.5'
      )}
    >
      {TABS.map(({ href, icon: Icon, label, section }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/');
        const accentClass = section ? SECTION_COLORS[section] : 'text-accent-blue';

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 min-w-[52px] min-h-[50px] rounded-xl',
              'transition-all duration-200 tap-target active:scale-95',
              isActive ? accentClass : 'text-text-tertiary'
            )}
          >
            <Icon
              size={24}
              strokeWidth={isActive ? 2.25 : 1.75}
              className="transition-transform duration-150"
            />
            <span className="text-[10px] font-medium tracking-tight">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
