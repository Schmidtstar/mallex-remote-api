
import React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './MobileDrawer.module.css'

export interface NavItem {
  key: string
  labelKey: string
  icon?: React.ReactNode
  onClick: () => void
  badge?: React.ReactNode
  visible?: boolean
}

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  items: NavItem[]
}

export default function MobileDrawer({ open, onClose, items }: MobileDrawerProps) {
  const { t } = useTranslation()

  if (!open) return null

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={`${styles.drawer} ${open ? styles.open : ''}`}>
        <div className={styles.content}>
          <nav className={styles.nav}>
            {items
              .filter(item => item.visible !== false)
              .map(item => (
                <button
                  key={item.key}
                  className={styles.navItem}
                  onClick={item.onClick}
                >
                  {item.icon && <span className={styles.icon}>{item.icon}</span>}
                  <span className={styles.label}>{t(item.labelKey)}</span>
                  {item.badge && <span className={styles.badge}>{item.badge}</span>}
                </button>
              ))}
          </nav>
        </div>
      </div>
    </>
  )
}
