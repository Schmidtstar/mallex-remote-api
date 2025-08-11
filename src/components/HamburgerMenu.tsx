import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import { useAuth } from '../context/AuthContext'
import { menuGroups, type MenuItem, type MenuGroup } from '../config/menuItems'
import styles from './HamburgerMenu.module.css'

interface HamburgerMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAdmin } = useAdmin()
  const { user, logout } = useAuth()

  // ESC key handler and body scroll lock
  useEffect(() => {
    if (!isOpen) return

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Lock body scroll
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscKey)

    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [isOpen, onClose])

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
                .filter(item => {
                  if (item.adminOnly && !isAdmin) return false
                  if (item.authRequired && !user) return false
                  return true
                })
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
          
          {/* Logout Button (wenn angemeldet) */}
          {user && (
            <div className={styles.menuGroup}>
              <button
                className={`${styles.menuItem} ${styles.logoutItem}`}
                onClick={() => {
                  logout()
                  onClose()
                }}
              >
                <span className={styles.icon}>🚪</span>
                <span className={styles.label}>
                  {t('menu.logout')}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}