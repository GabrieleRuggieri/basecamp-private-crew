/**
 * Utility: cn per classi Tailwind condizionali, createId per ID univoci.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Combina classi CSS con supporto per condizioni e merge Tailwind */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Genera ID univoco per file upload (es. moments) */
export function createId() {
  return crypto.randomUUID().replace(/-/g, '');
}
