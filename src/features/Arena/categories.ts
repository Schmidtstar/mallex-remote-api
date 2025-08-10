
export type CategoryId = 'fate' | 'shame' | 'seduce' | 'escalate' | 'confess'

export const categories: { id: CategoryId; labelKey: string }[] = [
  { id: 'fate', labelKey: 'categories.fate' },
  { id: 'seduce', labelKey: 'categories.seduce' },
  { id: 'confess', labelKey: 'categories.confess' },
  { id: 'escalate', labelKey: 'categories.escalate' },
  { id: 'shame', labelKey: 'categories.shame' }
]
