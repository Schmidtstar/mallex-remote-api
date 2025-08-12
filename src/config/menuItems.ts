
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'

export type MenuItem = {
  key: string
  path: string
  labelKey: string
  icon?: ReactNode | string
  requiresAuth?: boolean
  authRequired?: boolean // Backward compatibility
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
    key: 'tasks',
    path: '/tasks',
    labelKey: 'nav.tasks',
    icon: '📋',
    requiresAuth: true,
    authRequired: true
  },
  {
    key: 'suggestTask',
    path: '/tasks/suggest',
    labelKey: 'nav.suggest',
    icon: '💡',
    requiresAuth: true,
    authRequired: true
  },
  {
    key: 'adminTasks',
    path: '/admin/tasks',
    labelKey: 'nav.adminTasks',
    icon: '⚙️',
    adminOnly: true
  },
  {
    key: 'adminSuggestions',
    path: '/admin/suggestions',
    labelKey: 'nav.adminSuggestions',
    icon: '📝',
    adminOnly: true
  },
  {
    key: 'profile',
    path: '/profile',
    labelKey: 'nav.profile',
    icon: '👤',
    requiresAuth: true,
    authRequired: true
  },
  {
    key: 'settings',
    path: '/settings',
    labelKey: 'nav.settings',
    icon: '⚙️',
    requiresAuth: false
  }
]
