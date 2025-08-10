
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useAdmin } from '../../../context/AdminContext'

export default function ProfileTab() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isAdmin } = useAdmin()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (!user) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <h2>{t('menu.tabs.profile')}</h2>
        <div style={{ 
          padding: '24px', 
          backgroundColor: 'var(--glass)', 
          border: '1px solid var(--stroke)', 
          borderRadius: '12px',
          margin: '16px 0'
        }}>
          <p style={{ margin: '0 0 16px', fontSize: '18px' }}>👤 {t('menu.profile.guest')}</p>
          <button
            onClick={() => navigate('/auth')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary)',
              color: 'var(--bg)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            {t('menu.profile.loginCta')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      <h2>{t('menu.tabs.profile')}</h2>
      <div style={{ 
        padding: '20px', 
        backgroundColor: 'var(--glass)', 
        border: '1px solid var(--stroke)', 
        borderRadius: '12px',
        margin: '16px 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ fontSize: '32px' }}>👤</div>
          <div>
            <p style={{ margin: '0', fontSize: '18px', fontWeight: 600 }}>{user.email}</p>
            {isAdmin && (
              <span style={{
                display: 'inline-block',
                padding: '4px 8px',
                backgroundColor: 'var(--primary)',
                color: 'var(--bg)',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                marginTop: '4px'
              }}>
                {t('menu.profile.admin')}
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            color: 'var(--fg)',
            border: '1px solid var(--stroke)',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {t('menu.profile.logout')}
        </button>
      </div>
    </div>
  )
}
