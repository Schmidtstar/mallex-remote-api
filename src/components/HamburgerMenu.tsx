import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
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