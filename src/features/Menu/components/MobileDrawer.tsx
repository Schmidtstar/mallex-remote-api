
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import styles from './MobileDrawer.module.css'
import { MENU_ITEMS } from '../menuItems'
import { useAdmin } from '../../../context/AdminContext'
import { useTaskSuggestions } from '../../../context/TaskSuggestionsContext'

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
}

export default function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const { t, ready } = useTranslation()
  const navigate = useNavigate()
  const { isAdmin } = useAdmin()
  const { localAdmin } = useTaskSuggestions()

  if (!open) return null
  if (!ready) return null

  const handleItemClick = (to: string) => {
    navigate(to)
    onClose()
  }

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={`${styles.drawer} ${open ? styles.open : ''}`}>
        <div className={styles.content}>
          <nav className={styles.nav}>
            {MENU_ITEMS.map(item => (
              <button
                key={item.id}
                className={styles.navItem}
                onClick={() => handleItemClick(item.to)}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{t(item.labelKey) || item.fallbackLabel}</span>
              </button>
            ))}
            {/* Admin items */}
            {localAdmin && (
              <button
                key="dev"
                className={styles.navItem}
                onClick={() => handleItemClick('/menu?tab=dev')}
              >
                <span className={styles.icon}>🔧</span>
                <span className={styles.label}>{t('menu.tabs.dev') || 'Entwickler'}</span>
              </button>
            )}
            {isAdmin && (
              <button
                key="admin"
                className={styles.navItem}
                onClick={() => handleItemClick('/menu?tab=admin')}
              >
                <span className={styles.icon}>👑</span>
                <span className={styles.label}>{t('menu.tabs.admin') || 'Admin'}</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </>
  )
}
