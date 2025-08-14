import { useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useIsAdmin } from '../context/AdminContext'
import { menuItems } from '../config/menuItems'
import { NotificationCenter } from './NotificationCenter'
import { trapFocus } from '../lib/a11y'
import styles from './HamburgerMenu.module.css'

interface HamburgerMenuProps {
  open: boolean
  onClose: () => void
  triggerRef?: React.RefObject<HTMLButtonElement>
}

export function HamburgerMenu({ open, onClose, triggerRef }: HamburgerMenuProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const isAdmin = useIsAdmin()
  const drawerRef = useRef<HTMLDivElement>(null)
  const lastOpenAtRef = useRef<number>(0)

  // Set timestamp when drawer opens
  useEffect(() => {
    if (open) {
      lastOpenAtRef.current = Date.now()
    }
  }, [open])

  // Auto-close on route change with grace period
  useEffect(() => {
    if (!open) return
    const msSinceOpen = Date.now() - lastOpenAtRef.current
    if (msSinceOpen < 400) return // Grace period to prevent immediate close
    onClose()
  }, [location.pathname, open, onClose])

  // Focus management and body scroll lock
  useEffect(() => {
    if (open) {
      const first = drawerRef.current?.querySelector<HTMLElement>('button, a, [tabindex="0"]')
      first?.focus()

      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [open])

  // Return focus to trigger when closing
  useEffect(() => {
    if (!open && triggerRef?.current) {
      triggerRef.current.focus()
    }
  }, [open, triggerRef])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
    if (e.key === 'Tab') {
      trapFocus(e, drawerRef.current)
    }
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleItemClick = (item: any) => {
    if (item.action) {
      item.action()
    } else if (item.path) {
      navigate(item.path)
    }
    onClose()
  }

  if (!open) return null

  const visibleItems = menuItems.filter(item => {
    if (item.requiresAuth && !user) return false
    // Striktere Admin-Prüfung - nur echte Admins sehen Admin-Items
    if (item.adminOnly && (!user || !isAdmin)) return false
    return true
  })

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={drawerRef}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menuTitle"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 id="menuTitle" className={styles.menuTitle}>📜 Menü</h2>
            <button
              className={styles.closeBtn}
              onClick={onClose}
              aria-label={t('menu.close')}
            >
              ×
            </button>
          </div>
        </div>

        <nav className={styles.nav} role="navigation">
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Spiel</h3>
            {visibleItems
              .filter(item => ['arena', 'legends', 'leaderboard'].includes(item.key))
              .map(item => (
                <button
                  key={item.key}
                  className={styles.itemBtn}
                  onClick={() => handleItemClick(item)}
                >
                  <span className={styles.itemIcon}>{String(item.icon ?? '')}</span>
                  <span className={styles.itemLabel}>{t(item.labelKey)}</span>
                </button>
              ))}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('menu.tasks')}</h3>
            {visibleItems
              .filter(item => ['tasks', 'suggestTask'].includes(item.key))
              .map(item => (
                <button
                  key={item.key}
                  className={styles.itemBtn}
                  onClick={() => handleItemClick(item)}
                >
                  <span className={styles.itemIcon}>{String(item.icon ?? '')}</span>
                  <span className={styles.itemLabel}>
                    {item.key === 'tasks' ? t('menu.tasksOverview') :
                     item.key === 'suggestTask' ? t('menu.suggestTask') :
                     t(item.labelKey)}
                  </span>
                </button>
              ))}
          </div>

          

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('profile.title')}</h3>
            <div className={styles.notificationItem}>
              <NotificationCenter />
            </div>
            <button
              className={styles.itemBtn}
              onClick={() => handleItemClick({ path: '/menu?tab=profile' })}
            >
              <span className={styles.itemIcon}>👤</span>
              <span className={styles.itemLabel}>{t('menu.profile')}</span>
            </button>
            <button
              className={styles.itemBtn}
              onClick={() => handleItemClick({ path: '/menu?tab=settings' })}
            >
              <span className={styles.itemIcon}>⚙️</span>
              <span className={styles.itemLabel}>{t('menu.settings')}</span>
            </button>

            {user && !user.isAnonymous && (
              <button
                className={styles.itemBtn}
                onClick={logout}
              >
                <span className={styles.itemIcon}>🚪</span>
                <span className={styles.itemLabel}>{t('menu.logout')}</span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </div>
  )
}