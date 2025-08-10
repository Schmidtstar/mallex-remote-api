
import type { CategoryId } from './categories';

// Jede Challenge ist ein i18n-Key. Texte liegen in de.json / en.json unter "arena.<cat>.itemX".
export const challenges: Record<CategoryId, string[]> = {
  fate: [
    'arena.fate.item1',
    'arena.fate.item2',
    'arena.fate.item3',
    'arena.fate.item4',
    'arena.fate.item5',
  ],
  shame: [
    'arena.shame.item1',
    'arena.shame.item2',
    'arena.shame.item3',
    'arena.shame.item4',
    'arena.shame.item5',
  ],
  seduce: [
    'arena.seduce.item1',
    'arena.seduce.item2',
    'arena.seduce.item3',
    'arena.seduce.item4',
    'arena.seduce.item5',
  ],
  escalate: [
    'arena.escalate.item1',
    'arena.escalate.item2',
    'arena.escalate.item3',
    'arena.escalate.item4',
    'arena.escalate.item5',
  ],
  confess: [
    'arena.confess.item1',
    'arena.confess.item2',
    'arena.confess.item3',
    'arena.confess.item4',
    'arena.confess.item5',
  ],
};
