import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
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
    key: 'tasks',
    path: '/tasks',
    labelKey: 'nav.tasks',
    icon: '📋',
    requiresAuth: true
  },
  {
    key: 'suggestTask',
    path: '/suggest-task',
    labelKey: 'nav.suggestTask',
    icon: '💡',
    requiresAuth: false
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
    path: '/admin/tasks',
    labelKey: 'nav.admin',
    icon: '🔧',
    requiresAuth: true,
    adminOnly: true
  }
]