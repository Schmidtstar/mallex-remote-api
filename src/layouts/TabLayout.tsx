import React, { useState, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BottomNavigation } from '../components/BottomNavigation'
import { useSwipe } from '../hooks/useSwipe'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { HamburgerMenu } from '../components/HamburgerMenu'
import styles from './TabLayout.module.css'

export function TabLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const tabs = [
    { path: '/arena', label: '🏟️', ariaLabel: t('tabs.arena') },
    { path: '/legends', label: '🏛️', ariaLabel: t('tabs.legends') }
  ]

  const getCurrentTab = () => {
    const path = location.pathname
    if (path === '/' || path === '/arena') return 0
    if (path === '/legends') return 1
    return 0
  }

  const handleTabChange = (newValue: number) => {
    navigate(tabs[newValue].path)
  }

  // Swipe navigation
  useSwipe({
    onSwipeLeft: () => {
      const current = getCurrentTab()
      if (current < tabs.length - 1) {
        handleTabChange(current + 1)
      }
    },
    onSwipeRight: () => {
      const current = getCurrentTab()
      if (current > 0) {
        handleTabChange(current - 1)
      }
    }
  })

  const triggerRef = useRef<HTMLButtonElement>(null)
  const [showMenu, setShowMenu] = useState(false)


  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <div style={{
        display: 'flex',
        background: 'var(--glass)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid var(--stroke)',
        padding: '8px',
        justifyContent: 'space-around',
        alignItems: 'center'
      }}>
        {tabs.map((tab, index) => (
          <button
            key={tab.path}
            onClick={() => handleTabChange(index)}
            aria-label={tab.ariaLabel}
            style={{
              background: 'transparent',
              border: 'none',
              color: getCurrentTab() === index ? 'var(--primary)' : 'var(--fg)',
              cursor: 'pointer',
              padding: '12px 16px',
              fontSize: '24px',
              borderRadius: 'var(--radius)',
              transition: 'all 0.2s ease',
              opacity: getCurrentTab() === index ? 1 : 0.7,
              minWidth: '44px',
              minHeight: '44px'
            }}
          >
            {tab.label}
          </button>
        ))}

        {/* Hamburger Menu Button */}
        <button 
          ref={triggerRef}
          className={`${styles.tabButton} ${showMenu ? styles.active : ''}`}
          onClick={() => setShowMenu(true)}
          aria-label={t('tabs.menu')}
          aria-expanded={showMenu}
          aria-controls="hamburger-menu"
        >
          <span className={styles.tabIcon}>≡</span>
          <span className={styles.tabLabel}>{t('tabs.menu')}</span>
        </button>
      </div>

      {/* Hamburger Menu Drawer */}
      <HamburgerMenu 
        open={showMenu} 
        onClose={() => setShowMenu(false)} 
        triggerRef={triggerRef}
      />
    </div>
  )
}