
export interface Category {
  id: string
  items: string[]
}

export function useCategories(): Category[] {
  return [
    {
      id: 'fate',
      items: [
        'arena.fate.item1',
        'arena.fate.item2',
        'arena.fate.item3'
      ]
    },
    {
      id: 'seduce',
      items: [
        'arena.seduce.item1',
        'arena.seduce.item2',
        'arena.seduce.item3'
      ]
    },
    {
      id: 'confess',
      items: [
        'arena.confess.item1',
        'arena.confess.item2',
        'arena.confess.item3'
      ]
    },
    {
      id: 'escalate',
      items: [
        'arena.escalate.item1',
        'arena.escalate.item2',
        'arena.escalate.item3'
      ]
    },
    {
      id: 'shame',
      items: [
        'arena.shame.item1',
        'arena.shame.item2',
        'arena.shame.item3'
      ]
    }
  ]
}
