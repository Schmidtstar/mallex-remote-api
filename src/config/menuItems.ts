import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useIsAdmin } from '../context/AdminContext'
import type { ReactNode } from 'react'

export interface MenuItem {
  key: string
  labelKey: string
  icon?: ReactNode | string
  path?: string
  action?: () => void
  authRequired?: boolean
  adminOnly?: boolean
}

// Static menu items for components that need them directly
export const menuItems: MenuItem[] = [
  { key: 'arena', labelKey: 'menu.arena', path: '/arena' },
  { key: 'tasks', labelKey: 'menu.tasks', path: '/tasks' },
  { key: 'suggest', labelKey: 'menu.suggest', path: '/suggest', authRequired: true },
  { key: 'legends', labelKey: 'menu.legends', path: '/legends' },
  { key: 'profile', labelKey: 'menu.profile', path: '/profile', authRequired: true },
  { key: 'admin-tasks', labelKey: 'menu.adminTasks', path: '/admin/tasks', authRequired: true, adminOnly: true },
  { key: 'admin-suggestions', labelKey: 'menu.adminSuggestions', path: '/admin/suggestions', authRequired: true, adminOnly: true },
]

export const useMenuItems = () => {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const isAdmin = useIsAdmin()

  return menuItems
    .filter(item => {
      if (item.authRequired && !isAuthenticated) return false
      if (item.adminOnly && !isAdmin) return false
      return true
    })
    .map(item => ({
      ...item,
      label: t(item.labelKey)
    }))
}