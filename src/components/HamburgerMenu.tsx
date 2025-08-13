import { useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useIsAdmin } from '../context/AdminContext'
import { menuItems } from '../config/menuItems'
import { trapFocus } from '../lib/a11y'
import styles from './HamburgerMenu.module.css'

interface HamburgerMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()
  const isAdmin = useIsAdmin()
  const menuRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      if (menuRef.current) {
        trapFocus(menuRef.current)
      }
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.action) {
      item.action()
    } else {
      navigate(item.path)
    }
    onClose()
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/auth')
      onClose()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (!isOpen) return null

  // Filter menu items based on user auth and admin status
  const visibleMenuItems = menuItems.filter(item => {
    // If item requires auth but user is not logged in, hide it
    if (item.requiresAuth && !user) return false
    
    // If item is admin only but user is not admin, hide it
    if (item.adminOnly && !isAdmin) return false
    
    return true
  })

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        ref={menuRef}
        className={styles.menu}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('nav.menu')}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{t('nav.menu')}</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <nav className={styles.navigation}>
            {visibleMenuItems.map((item) => (
              <button
                key={item.key}
                className={`${styles.menuItem} ${
                  location.pathname === item.path ? styles.menuItemActive : ''
                }`}
                onClick={() => handleMenuClick(item)}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <span className={styles.menuLabel}>{t(item.labelKey)}</span>
                {item.adminOnly && (
                  <span className={styles.adminBadge}>Admin</span>
                )}
              </button>
            ))}
          </nav>

          {user && (
            <div className={styles.footer}>
              <div className={styles.userInfo}>
                <span className={styles.userIcon}>👤</span>
                <span className={styles.userName}>
                  {user.displayName || user.email}
                </span>
                {isAdmin && (
                  <span className={styles.adminIndicator}>🔧</span>
                )}
              </div>
              <button 
                className={styles.signOutButton}
                onClick={handleSignOut}
              >
                {t('auth.signOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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
    if (item.adminOnly && !isAdmin) return false
    if (item.requiresAuth && !user) return false
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
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t('menu.close')}
          >
            ×
          </button>
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

          {isAdmin && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>{t('menu.admin')}</h3>
              {visibleItems
                .filter(item => ['admin'].includes(item.key))
                .map(item => (
                  <button
                    key={item.key}
                    className={styles.itemBtn}
                    onClick={() => handleItemClick(item)}
                  >
                    <span className={styles.itemIcon}>{String(item.icon ?? '')}</span>
                    <span className={styles.itemLabel}>{t('menu.adminTasks')}</span>
                  </button>
                ))}
            </div>
          )}

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('profile.title')}</h3>
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