
export interface Category {
  id: string;
  labelKey: string;
}

export const categories: Category[] = [
  { id: 'fate', labelKey: 'categories.fate' },
  { id: 'shame', labelKey: 'categories.shame' },
  { id: 'seduce', labelKey: 'categories.seduce' },
  { id: 'escalate', labelKey: 'categories.escalate' },
  { id: 'confess', labelKey: 'categories.confess' }
];
