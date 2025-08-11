// NO DEFAULT EXPORTS - Only named exports to prevent star export issues
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
      { key: 'settings', icon: '⚙️', path: '/settings' },
      { key: 'profile', icon: '👤', path: '/profile' },
      { key: 'tasks', icon: '📋', path: '/tasks' },
      { key: 'suggest', icon: '💡', path: '/suggest' },
    ]
  },
  {
    items: [
      { key: 'leaderboard', icon: '🏆', path: '/leaderboard' },
      { key: 'rules', icon: '📖', path: '/rules' },
      { key: 'about', icon: 'ℹ️', path: '/about' },
    ]
  },
  {
    items: [
      { key: 'taskManager', icon: '🛠️', path: '/admin/tasks', adminOnly: true },
      { key: 'devManager', icon: '👨‍💻', path: '/admin/dev', adminOnly: true },
    ]
  }
]