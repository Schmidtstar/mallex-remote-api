
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  const { isAdmin } = useAdmin()

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
      <div className={`${styles.drawer} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>MALLEX</h2>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="Menü schließen"
          >
            ✕
          </button>
        </div>
        
        <div className={styles.content}>
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex} className={styles.menuGroup}>
              {group.items
                .filter(item => !item.adminOnly || isAdmin)
                .map(item => (
                  <div
                    key={item.key}
                    className={styles.menuItem}
                    onClick={() => handleItemClick(item.path, item.action)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleItemClick(item.path, item.action)
                      }
                    }}
                  >
                    <span className={styles.menuIcon}>{item.icon}</span>
                    <span className={styles.menuText}>
                      {t(`menu.${item.key}`)}
                    </span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
