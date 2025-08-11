
import React, { useState, useEffect } from 'react'
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

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

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

  const menuItems = [
    { 
      key: 'settings', 
      label: t('menu.tabs.settings'), 
      icon: '⚙️',
      action: () => alert('Settings - To be implemented')
    },
    { 
      key: 'profile', 
      label: t('menu.tabs.profile'), 
      icon: '👤',
      action: () => {
        if (user) {
          alert('Profile - To be implemented')
        } else {
          navigate('/auth')
        }
      }
    },
    { 
      key: 'tasks', 
      label: t('menu.tabs.tasks'), 
      icon: '✅',
      action: () => alert('Tasks - To be implemented')
    },
    { 
      key: 'suggest', 
      label: t('menu.tabs.suggest'), 
      icon: '💡',
      action: () => alert('Suggest - To be implemented')
    },
    ...(isAdmin ? [{ 
      key: 'admin', 
      label: t('menu.tabs.admin'), 
      icon: '🛠️',
      action: () => alert('Admin - To be implemented')
    }] : []),
    { 
      key: 'leaderboard', 
      label: t('menu.tabs.leaderboard'), 
      icon: '🏆',
      action: () => alert('Leaderboard - To be implemented')
    },
    { 
      key: 'rules', 
      label: t('menu.tabs.rules'), 
      icon: '📋',
      action: () => alert('Rules - To be implemented')
    },
    { 
      key: 'about', 
      label: t('menu.tabs.about'), 
      icon: 'ℹ️',
      action: () => alert('About - To be implemented')
    },
    ...(localAdmin ? [{ 
      key: 'dev', 
      label: t('menu.tabs.dev'), 
      icon: '🔧',
      action: () => alert('Dev - To be implemented')
    }] : [])
  ]

  const handleItemClick = (action: () => void) => {
    action()
    closeMenu()
  }

  return (
    <>
      <button 
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
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
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
