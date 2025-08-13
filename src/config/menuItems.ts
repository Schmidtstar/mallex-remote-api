// Configuration file - no React hooks needed here
import type { ReactNode } from 'react'

export type MenuItem = {
  key: string
  path: string
  labelKey: string
  icon?: ReactNode | string
  requiresAuth?: boolean
  adminOnly?: boolean
  action?: () => void
}

export const menuItems: MenuItem[] = [
  {
    key: 'arena',
    path: '/arena',
    labelKey: 'nav.arena',
    icon: '⚔️',
    requiresAuth: false
  },
  {
    key: 'legends',
    path: '/legends',
    labelKey: 'nav.legends',
    icon: '🏛️',
    requiresAuth: false
  },
  {
    key: 'leaderboard',
    path: '/leaderboard',
    labelKey: 'nav.leaderboard',
    icon: '🏆',
    requiresAuth: false
  },
  {
    key: 'tasks',
    path: '/tasks',
    labelKey: 'nav.tasks',
    icon: '📋',
    requiresAuth: true
  },
  {
    key: 'suggestTask',
    path: '/tasks/suggest',
    labelKey: 'tasks.suggest.title',
    icon: '💭',
    requiresAuth: true
  },
  {
    key: 'profile',
    path: '/profile',
    labelKey: 'nav.profile',
    icon: '👤',
    requiresAuth: true
  },
  {
    key: 'settings',
    path: '/settings',
    labelKey: 'nav.settings',
    icon: '⚙️',
    requiresAuth: false
  },
  {
    key: 'admin',
    path: '/admin/dashboard',
    labelKey: 'nav.admin',
    icon: '🔧',
    requiresAuth: true,
    adminOnly: true
  },
  {
    key: 'adminTasks',
    path: '/admin/tasks',
    labelKey: 'nav.adminTasks',
    icon: '📋',
    requiresAuth: true,
    adminOnly: true
  }
]