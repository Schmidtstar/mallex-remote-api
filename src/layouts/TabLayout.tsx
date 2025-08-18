import React, { useState, useRef, useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import BottomNavigation from '../components/BottomNavigation'
import { useSwipe } from '../hooks/useSwipe'
import { useTranslation } from 'react-i18next'
import { HamburgerMenu } from '../components/HamburgerMenu'

export function TabLayout() {
  const location = useLocation()
  const navigate = useNavigate()
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

  const openMenu = useCallback(() => {
    setIsMenuOpen(true)
  }, [])

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  // Swipe navigation
  const swipeHandlers = useSwipe(
    {
      onSwipeLeft: () => {
        const currentIndex = tabs.findIndex(tab => tab.path === location.pathname)
        const nextIndex = Math.min(currentIndex + 1, tabs.length - 1)
        if (nextIndex !== currentIndex) {
          navigate(tabs[nextIndex].path)
        }
      },
      onSwipeRight: () => {
        const currentIndex = tabs.findIndex(tab => tab.path === location.pathname)
        const prevIndex = Math.max(currentIndex - 1, 0)
        if (prevIndex !== currentIndex) {
          navigate(tabs[prevIndex].path)
        }
      }
    },
    { threshold: 75 }
  )

  // Extract only DOM-compatible event handlers
  const { onTouchStart, onTouchMove, onTouchEnd, onMouseDown, onMouseMove, onMouseUp } = swipeHandlers

  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <main
        className={styles.mainContent}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation openMenu={openMenu} />

      {/* Hamburger Menu Drawer */}
      <HamburgerMenu
        open={isMenuOpen}
        onClose={closeMenu}
        triggerRef={triggerRef}
      />
    </div>
  )
}

// Fixed: Proper default export
const TabLayoutComponent = TabLayout
export default TabLayoutComponent