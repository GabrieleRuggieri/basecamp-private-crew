import type { TrainingType } from '@/lib/actions/training';

export const VALID_TRAINING_TYPES: TrainingType[] = ['gym', 'tricking', 'calisthenics'];

export function isValidTrainingType(type: string): type is TrainingType {
  return VALID_TRAINING_TYPES.includes(type as TrainingType);
}
