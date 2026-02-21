/**
 * Training: hub con scelta tra Gym, Tricking, Calistenics.
 */
import { getSession } from '@/lib/actions/auth';
import Link from 'next/link';
import { Dumbbell } from 'lucide-react';
import { TrickingIcon } from '@/components/icons/TrickingIcon';
import { CalisthenicsIcon } from '@/components/icons/CalisthenicsIcon';

const TRAINING_TYPES = [
  {
    type: 'gym',
    href: '/training/gym',
    label: 'Gym',
    description: 'Allenamento in palestra',
    icon: Dumbbell,
    accent: 'accent-red',
  },
  {
    type: 'tricking',
    href: '/training/tricking',
    label: 'Tricking',
    description: 'Parkour e acrobazie',
    icon: TrickingIcon,
    accent: 'accent-red',
  },
  {
    type: 'calisthenics',
    href: '/training/calisthenics',
    label: 'Calisthenics',
    description: 'Esercizi a corpo libero',
    icon: CalisthenicsIcon,
    accent: 'accent-red',
  },
] as const;

export default async function TrainingPage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <main className="min-h-dvh">
      <header className="px-5 pt-4 pb-2 safe-area-top">
        <h1
          className="text-title font-bold text-text-primary"
          style={{ letterSpacing: '-0.04em' }}
        >
          Training
        </h1>
        <p className="text-footnote text-text-tertiary mt-1">
          Scegli il tipo di allenamento
        </p>
      </header>

      <div className="px-5 space-y-4">
        {TRAINING_TYPES.map(({ href, label, description, icon: Icon, accent }) => (
          <Link
            key={href}
            href={href}
            className={`card p-5 rounded-xl flex items-center gap-4 transition-all active:scale-[0.98] border-l-4 border-[var(--${accent})]`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--${accent})]/20`}
            >
              <Icon size={24} className={`text-[var(--${accent})]`} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-subhead font-semibold text-text-primary">{label}</h2>
              <p className="text-footnote text-text-tertiary mt-0.5">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
