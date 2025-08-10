// Einheitliche Kategorien (5 Stück) – Single Source of Truth
export type CategoryId = 'fate' | 'shame' | 'seduce' | 'escalate' | 'confess';

export const categories: { id: CategoryId; labelKey: string }[] = [
  { id: 'fate',     labelKey: 'categories.fate' },     // Schicksal
  { id: 'shame',    labelKey: 'categories.shame' },    // Schande
  { id: 'seduce',   labelKey: 'categories.seduce' },   // Verführung
  { id: 'escalate', labelKey: 'categories.escalate' }, // Eskalation
  { id: 'confess',  labelKey: 'categories.confess' },  // Beichte
];