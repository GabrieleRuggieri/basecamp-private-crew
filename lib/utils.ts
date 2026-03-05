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

/** Format sets: uniform "70kg 4×8", pyramid "70kg 12, 10, 8, 6" or "70kg 8 rep, 80kg 6 rep" */
export function formatSetsCompact(
  arr: { w: number | null; r: number | null }[]
): string {
  if (arr.length === 0) return '';
  const parts: string[] = [];
  let i = 0;
  while (i < arr.length) {
    const { w, r } = arr[i];
    let count = 1;
    while (i + count < arr.length && arr[i + count].w === w && arr[i + count].r === r) {
      count++;
    }
    if (count > 1) {
      parts.push(w != null ? `${w}kg ${count}×${r ?? '?'}` : `${count}×${r ?? '?'}`);
    } else {
      const repsVary = i + 1 < arr.length && arr[i + 1].w === w && arr[i + 1].r !== r;
      if (repsVary) {
        const repsGroup: (number | null)[] = [];
        let j = i;
        while (j < arr.length && arr[j].w === w) {
          repsGroup.push(arr[j].r);
          j++;
        }
        if (repsGroup.length > 1) {
          parts.push(w != null ? `${w}kg ${repsGroup.map((r) => r ?? '?').join(', ')}` : repsGroup.map((r) => r ?? '?').join(', '));
          i = j;
          continue;
        }
      }
      parts.push(w != null ? `${w}kg ${r ?? '?'} rep` : `${r ?? '?'} rep`);
    }
    i += count;
  }
  return parts.join(', ');
}
