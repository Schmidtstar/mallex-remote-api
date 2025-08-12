
export interface Category {
  id: string;
  labelKey: string;
}

export const categories: Category[] = [
  { id: 'fate', labelKey: 'arena.categories.fate' },
  { id: 'shame', labelKey: 'arena.categories.shame' },
  { id: 'seduce', labelKey: 'arena.categories.seduce' },
  { id: 'escalate', labelKey: 'arena.categories.escalate' },
  { id: 'confess', labelKey: 'arena.categories.confess' }
];

export type CategoryKey = 'fate' | 'shame' | 'seduce' | 'escalate' | 'confess';
