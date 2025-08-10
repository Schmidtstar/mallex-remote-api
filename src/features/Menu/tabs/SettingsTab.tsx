import React from 'react'
import { useTranslation } from 'react-i18next'

export function SettingsTab() {
  const { t, i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2>{t('menu.tabs.settings')}</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '14px', fontWeight: 500 }}>Sprache / Language:</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => changeLanguage('de')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: i18n.language === 'de' ? 'var(--primary)' : 'transparent',
              color: i18n.language === 'de' ? 'var(--bg)' : 'var(--fg)',
              border: '1px solid var(--stroke)',
              cursor: 'pointer',
              fontWeight: i18n.language === 'de' ? 600 : 400
            }}
          >
            Deutsch
          </button>
          <button
            onClick={() => changeLanguage('en')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: i18n.language === 'en' ? 'var(--primary)' : 'transparent',
              color: i18n.language === 'en' ? 'var(--bg)' : 'var(--fg)',
              border: '1px solid var(--stroke)',
              cursor: 'pointer',
              fontWeight: i18n.language === 'en' ? 600 : 400
            }}
          >
            English
          </button>
        </div>
      </div>

      <div style={{ 
        padding: '12px', 
        backgroundColor: 'var(--glass)', 
        border: '1px solid var(--stroke)', 
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <strong>Status:</strong> {import.meta.env.VITE_FIREBASE_API_KEY ? 'Firebase aktiv' : 'Gastmodus'}
      </div>
    </div>
  )
}