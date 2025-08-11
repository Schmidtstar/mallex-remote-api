import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useIsAdmin } from '../context/AdminContext'

export interface MenuItem {
  key: string
  labelKey: string
  path: string
  requiresAuth?: boolean
  adminOnly?: boolean
}

// Static menu items for components that need them directly
export const menuItems: MenuItem[] = [
  { key: 'arena', labelKey: 'menu.arena', path: '/arena' },
  { key: 'tasks', labelKey: 'menu.tasks', path: '/tasks' },
  { key: 'suggest', labelKey: 'menu.suggest', path: '/suggest', requiresAuth: true },
  { key: 'legends', labelKey: 'menu.legends', path: '/legends' },
  { key: 'profile', labelKey: 'menu.profile', path: '/profile', requiresAuth: true },
  { key: 'admin-tasks', labelKey: 'menu.adminTasks', path: '/admin/tasks', requiresAuth: true, adminOnly: true },
  { key: 'admin-suggestions', labelKey: 'menu.adminSuggestions', path: '/admin/suggestions', requiresAuth: true, adminOnly: true },
]

export const useMenuItems = () => {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const isAdmin = useIsAdmin()

  return menuItems
    .filter(item => {
      if (item.requiresAuth && !isAuthenticated) return false
      if (item.adminOnly && !isAdmin) return false
      return true
    })
    .map(item => ({
      ...item,
      label: t(item.labelKey)
    }))
}