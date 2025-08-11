
export interface MenuItem {
  key: 'arena' | 'legends' | 'profile' | 'settings'
  labelKey: string
  path: string
  icon?: string
}

export interface MenuGroup {
  id: string
  items: MenuItem[]
}

export const menuGroups: MenuGroup[] = [
  {
    id: 'main',
    items: [
      { key: 'arena', labelKey: 'menu.arena', path: '/arena', icon: '🏟️' },
      { key: 'legends', labelKey: 'menu.legends', path: '/legends', icon: '🏛️' },
      { key: 'profile', labelKey: 'menu.profile', path: '/menu?tab=profile', icon: '👤' },
      { key: 'settings', labelKey: 'menu.settings', path: '/menu?tab=settings', icon: '⚙️' }
    ]
  }
]
