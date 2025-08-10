import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'

export default function ProfileTab() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleAuthAction = async () => {
    if (user) {
      await logout()
    } else {
      navigate('/auth')
    }
  }

  return (
    <div>
      <h2 style={{ color: 'var(--fg)', marginBottom: '2rem' }}>
        {t('menu.tabs.profile')}
      </h2>

      <div style={{
        padding: '24px',
        background: 'var(--glass)',
        border: '1px solid var(--stroke)',
        borderRadius: 'var(--radius)',
        textAlign: 'center'
      }}>
        {user ? (
          <>
            <div style={{
              color: 'var(--fg)',
              marginBottom: '8px',
              fontSize: '1.1rem'
            }}>
              {user.email || t('menu.profile.guest')}
            </div>
            <button
              onClick={handleAuthAction}
              style={{
                padding: '12px 24px',
                background: '#f87171',
                color: '#000',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontSize: '1rem',
                marginTop: '16px'
              }}
            >
              {t('menu.profile.logout')}
            </button>
          </>
        ) : (
          <>
            <div style={{
              color: 'var(--fg)',
              marginBottom: '16px',
              fontSize: '1.1rem'
            }}>
              {t('menu.profile.guest')}
            </div>
            <button
              onClick={handleAuthAction}
              style={{
                padding: '12px 24px',
                background: 'var(--primary)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              {t('menu.profile.loginCta')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}