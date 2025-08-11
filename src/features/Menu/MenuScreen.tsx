import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import styles from './MenuScreen.module.css'

export function MenuScreen() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useTranslation()
  const { user, signOut, loading } = useAuth()

  const currentTab = searchParams.get('tab') || 'profile'

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab })
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{t('menu.title')}</h1>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${currentTab === 'profile' ? styles.active : ''}`}
          onClick={() => handleTabChange('profile')}
        >
          {t('menu.profile')}
        </button>
        <button
          className={`${styles.tab} ${currentTab === 'settings' ? styles.active : ''}`}
          onClick={() => handleTabChange('settings')}
        >
          {t('menu.settings')}
        </button>
      </div>

      <div className={styles.content}>
        {currentTab === 'profile' && (
          <div className={styles.card}>
            <h2>{t('menu.profile')}</h2>
            {user ? (
              <>
                <div className={styles.userInfo}>
                  <p><strong>E-Mail:</strong> {user.email}</p>
                  <p><strong>Status:</strong> {user.isAnonymous ? t('auth.guestMode') : 'Registriert'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className={styles.logoutButton}
                  aria-label={t('menu.logout')}
                >
                  {t('menu.logout')}
                </button>
              </>
            ) : (
              <div className={styles.guestInfo}>
                <p>Nicht angemeldet</p>
              </div>
            )}
          </div>
        )}

        {currentTab === 'settings' && (
          <div className={styles.card}>
            <h2>{t('menu.settings')}</h2>
            <div className={styles.settingsSection}>
              <h3>Sprache</h3>
              <p>Einstellungen werden hier angezeigt...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}