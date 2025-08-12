
export interface Category {
  id: string;
  labelKey: string;
}

export const categories: Category[] = [
  { id: 'fate', labelKey: 'arena.categories.schicksal' },
  { id: 'shame', labelKey: 'arena.categories.schande' },
  { id: 'seduce', labelKey: 'arena.categories.verfuehrung' },
  { id: 'escalate', labelKey: 'arena.categories.eskalation' },
  { id: 'confess', labelKey: 'arena.categories.beichte' }
];

export type CategoryKey = 'fate' | 'shame' | 'seduce' | 'escalate' | 'confess';
