
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAdmin } from '../context/AdminContext'
import { useTaskSuggestions } from '../context/TaskSuggestionsContext'
import { useTranslation } from 'react-i18next'
import styles from './HamburgerMenu.module.css'

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isAdmin } = useAdmin()
  const { localAdmin } = useTaskSuggestions()
  const { t, i18n } = useTranslation()

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  const menuItems = [
    { 
      key: 'settings', 
      label: t('menu.tabs.settings'), 
      icon: '⚙️',
      action: () => console.log('Settings clicked')
    },
    { 
      key: 'profile', 
      label: t('menu.tabs.profile'), 
      icon: '👤',
      action: () => console.log('Profile clicked')
    },
    { 
      key: 'tasks', 
      label: t('menu.tabs.tasks'), 
      icon: '✅',
      action: () => console.log('Tasks clicked')
    },
    { 
      key: 'suggest', 
      label: t('menu.tabs.suggest'), 
      icon: '💡',
      action: () => console.log('Suggest clicked')
    },
    ...(isAdmin ? [{ 
      key: 'admin', 
      label: t('menu.tabs.admin'), 
      icon: '🛠️',
      action: () => console.log('Admin clicked')
    }] : []),
    { 
      key: 'leaderboard', 
      label: t('menu.tabs.leaderboard'), 
      icon: '🏆',
      action: () => console.log('Leaderboard clicked')
    },
    { 
      key: 'rules', 
      label: t('menu.tabs.rules'), 
      icon: '📋',
      action: () => console.log('Rules clicked')
    },
    { 
      key: 'about', 
      label: t('menu.tabs.about'), 
      icon: 'ℹ️',
      action: () => console.log('About clicked')
    },
    ...(localAdmin ? [{ 
      key: 'dev', 
      label: t('menu.tabs.dev'), 
      icon: '🔧',
      action: () => console.log('Dev clicked')
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
          <div className={styles.drawer}>
            <div className={styles.header}>
              <h2>{t('menu.title')}</h2>
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
