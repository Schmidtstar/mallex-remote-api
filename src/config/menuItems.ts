
export interface MenuItem {
  key: string
  icon: string
  path?: string
  action?: () => void
  adminOnly?: boolean
}

export interface MenuGroup {
  items: MenuItem[]
}

export const menuGroups: MenuGroup[] = [
  {
    items: [
      {
        key: 'arena',
        icon: '⚔️',
        path: '/arena'
      },
      {
        key: 'legends',
        icon: '🏆',
        path: '/legends'
      },
      {
        key: 'profile',
        icon: '👤',
        path: '/profile'
      },
      {
        key: 'settings',
        icon: '⚙️',
        path: '/settings'
      },
      {
        key: 'admin',
        icon: '🔧',
        path: '/admin',
        adminOnly: true
      }
    ]
  }
]
