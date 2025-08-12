
export interface Category {
  id: string;
  labelKey: string;
}

export const categories: Category[] = [
  { id: 'schicksal', labelKey: 'arena.categories.schicksal' },
  { id: 'schande', labelKey: 'arena.categories.schande' },
  { id: 'verfuehrung', labelKey: 'arena.categories.verfuehrung' },
  { id: 'eskalation', labelKey: 'arena.categories.eskalation' },
  { id: 'beichte', labelKey: 'arena.categories.beichte' }
];

export type CategoryKey = 'schicksal' | 'schande' | 'verfuehrung' | 'eskalation' | 'beichte';
