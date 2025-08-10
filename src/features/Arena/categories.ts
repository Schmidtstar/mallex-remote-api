export type Category = { id: string; name: string; items: string[] }

export const categories: Category[] = [
  { id: 'fate', name: 'Schicksal', items: [
    'Wähle eine Person, die 2 Schluck trinkt.',
    'Alle mit roten Kleidungsstücken trinken 1 Schluck.'
  ]},
  { id: 'confess', name: 'Beichte', items: [
    'Erzähle ein Geheimnis oder trinke 2 Schluck.',
    'Zeige den letzten Chatverlauf (oder trinke 3 Schluck).'
  ]}
]
