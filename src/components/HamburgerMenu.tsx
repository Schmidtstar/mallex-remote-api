import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { menuGroups } from '../config/menuItems'
import { useAdmin } from '../context/AdminContext'
import styles from './HamburgerMenu.module.css'

interface HamburgerMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAdmin, loading: adminLoading } = useAdmin()

  const visibleMenuItems = menuGroups[0].items.filter(item =>
    !item.adminOnly || isAdmin
  )

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

  const handleItemClick = (path: string) => {
    navigate(path)
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
          <div className={styles.menuGroup}>
            {visibleMenuItems.map((item) => (
              <button
                key={item.key}
                className={styles.menuItem}
                onClick={() => handleItemClick(item.path)}
                aria-label={t(item.labelKey)}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>
                  {t(item.labelKey)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}