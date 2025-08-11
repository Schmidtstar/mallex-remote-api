
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import styles from './HamburgerMenu.module.css'

// Types
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

interface HamburgerMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAdmin } = useAdmin()
  
  // Hardcoded fallback menu structure
  const fallbackMenuGroups: MenuGroup[] = [
    {
      items: [
        { key: 'settings', icon: '⚙️', path: '/settings' },
        { key: 'profile', icon: '👤', path: '/profile' },
      ]
    },
    {
      items: [
        { key: 'tasks', icon: '📋', path: '/tasks' },
        { key: 'suggest', icon: '💡', path: '/suggest' },
        { key: 'leaderboard', icon: '🏆', path: '/leaderboard' },
      ]
    },
    {
      items: [
        { key: 'rules', icon: '📜', path: '/rules' },
        { key: 'about', icon: 'ℹ️', path: '/about' },
      ]
    },
    {
      items: [
        { key: 'taskManager', icon: '🔧', path: '/admin/tasks', adminOnly: true },
        { key: 'devManager', icon: '👨‍💻', path: '/admin/dev', adminOnly: true },
      ]
    }
  ]

  // Try to import, fall back to hardcoded version
  let menuGroups = fallbackMenuGroups
  try {
    const menuConfig = require('../config/menuItems')
    if (menuConfig.menuGroups && Array.isArray(menuConfig.menuGroups)) {
      menuGroups = menuConfig.menuGroups
    }
  } catch (error) {
    console.warn('Could not load menu config, using fallback:', error)
  }

  const handleItemClick = (path?: string, action?: () => void) => {
    if (action) {
      action()
    } else if (path) {
      navigate(path)
    }
    onClose()
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.drawer}>
        <div className={styles.header}>
          <h2 className={styles.title}>MALLEX</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className={styles.content}>
          {menuGroups && menuGroups.map((group, groupIndex) => (
            <div key={groupIndex} className={styles.menuGroup}>
              {group && group.items && group.items
                .filter(item => !item.adminOnly || isAdmin)
                .map((item) => (
                  <button
                    key={item.key}
                    className={styles.menuItem}
                    onClick={() => handleItemClick(item.path, item.action)}
                  >
                    <span className={styles.icon}>{item.icon}</span>
                    <span className={styles.label}>
                      {t(`menu.${item.key}`)}
                    </span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
