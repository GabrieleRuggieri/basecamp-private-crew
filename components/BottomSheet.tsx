/**
 * Bottom sheet modale: slide-up da basso, overlay scuro, blocca scroll body.
 * Usato per form add (travels, watchlist) e finish workout (mood picker).
 */
'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
};

export function BottomSheet({ isOpen, onClose, children, title }: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sheet = (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-[100] transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[101] rounded-t-[22px] overflow-hidden',
          'bg-surface border border-t border-[var(--card-border)]',
          'safe-area-bottom',
          'animate-slide-up'
        )}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 rounded-full bg-text-tertiary/40" />
        </div>
        {title && (
          <h2 className="text-headline font-semibold text-text-primary px-5 pb-4">
            {title}
          </h2>
        )}
        <div className="px-5 pb-8 max-h-[70dvh] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );

  return typeof document !== 'undefined'
    ? createPortal(sheet, document.body)
    : null;
}
