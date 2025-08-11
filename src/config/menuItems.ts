
export interface MenuItem {
  key: string
  icon: string
  path?: string
  action?: () => void
  adminOnly?: boolean
  authRequired?: boolean
}

export interface MenuGroup {
  items: MenuItem[]
}

export const menuGroups: MenuGroup[] = [
  // Navigation
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
      }
    ]
  },
  // User Area
  {
    items: [
      {
        key: 'profile',
        icon: '👤',
        path: '/profile',
        authRequired: true
      },
      {
        key: 'settings',
        icon: '⚙️',
        path: '/settings'
      }
    ]
  },
  // Admin Area
  {
    items: [
      {
        key: 'admin',
        icon: '🔧',
        path: '/admin',
        adminOnly: true
      }
    ]
  }
]
