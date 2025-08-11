
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAdmin } from '../context/AdminContext'
import { useTaskSuggestions } from '../context/TaskSuggestionsContext'
import { useTranslation } from 'react-i18next'
import styles from './HamburgerMenu.module.css'

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { isAdmin } = useAdmin()
  const { localAdmin } = useTaskSuggestions()
  const { t, i18n } = useTranslation()
  const drawerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      // Focus will be set to drawer in useEffect
      setTimeout(() => {
        drawerRef.current?.focus()
      }, 100)
    }
  }
  
  const closeMenu = () => {
    setIsOpen(false)
    // Return focus to trigger button
    setTimeout(() => {
      triggerRef.current?.focus()
    }, 100)
  }

  // ESC key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // Close drawer on route change
  useEffect(() => {
    closeMenu()
  }, [location.pathname])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  const menuItems = [
    { 
      key: 'settings', 
      label: t('menu.tabs.settings'), 
      icon: '⚙️',
      action: () => {
        // Navigate to settings page or show settings modal
        console.log('Navigate to settings')
      }
    },
    { 
      key: 'profile', 
      label: t('menu.tabs.profile'), 
      icon: '👤',
      action: () => {
        if (user) {
          // Navigate to profile page
          console.log('Navigate to profile')
        } else {
          navigate('/auth')
        }
      }
    },
    { 
      key: 'tasks', 
      label: t('menu.tabs.tasks'), 
      icon: '✅',
      action: () => {
        // Navigate to tasks page
        console.log('Navigate to tasks')
      }
    },
    { 
      key: 'suggest', 
      label: t('menu.tabs.suggest'), 
      icon: '💡',
      action: () => {
        // Navigate to suggestions page
        console.log('Navigate to suggest')
      }
    },
    ...(isAdmin ? [{ 
      key: 'admin', 
      label: t('menu.tabs.admin'), 
      icon: '🛠️',
      action: () => {
        // Navigate to admin page
        console.log('Navigate to admin')
      }
    }] : []),
    { 
      key: 'leaderboard', 
      label: t('menu.tabs.leaderboard'), 
      icon: '🏆',
      action: () => {
        // Navigate to leaderboard page
        console.log('Navigate to leaderboard')
      }
    },
    { 
      key: 'rules', 
      label: t('menu.tabs.rules'), 
      icon: '📋',
      action: () => {
        // Navigate to rules page
        console.log('Navigate to rules')
      }
    },
    { 
      key: 'about', 
      label: t('menu.tabs.about'), 
      icon: 'ℹ️',
      action: () => {
        // Navigate to about page
        console.log('Navigate to about')
      }
    },
    ...(localAdmin ? [{ 
      key: 'dev', 
      label: t('menu.tabs.dev'), 
      icon: '🔧',
      action: () => {
        // Navigate to dev tools
        console.log('Navigate to dev')
      }
    }] : [])
  ]

  const handleItemClick = (action: () => void) => {
    action()
    closeMenu()
  }

  return (
    <>
      <button 
        ref={triggerRef}
        onClick={toggleMenu}
        className={styles.hamburgerButton}
        aria-label="Menu"
      >
        ≡
      </button>

      {isOpen && (
        <>
          <div className={styles.overlay} onClick={closeMenu} />
          <div 
            ref={drawerRef}
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            tabIndex={-1}
          >
            <div className={styles.header}>
              <h2 id="drawer-title">{t('menu.title')}</h2>
              <button onClick={closeMenu} className={styles.closeButton}>
                ✕
              </button>
            </div>
            
            <div className={styles.content}>
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleItemClick(item.action)}
                  className={styles.menuItem}
                >
                  <span className={styles.icon}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
              
              {user && (
                <button
                  onClick={() => {
                    logout()
                    closeMenu()
                  }}
                  className={styles.menuItem}
                >
                  <span className={styles.icon}>🚪</span>
                  <span>{t('auth.logout')}</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
