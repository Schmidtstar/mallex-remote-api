import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function MenuScreen() {
  const { t, i18n } = useTranslation()
  const { signOutAll, isAnonymous, user } = useAuth()
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)

  async function logout() {
    try {
      setBusy(true)
      await signOutAll()
      nav('/auth', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <h1>{t('menu.title')}</h1>
      <div style={{display:'grid', gap:16, maxWidth:420}}>

        <div className="card glass">
          <label>{t('menu.language')}: </label>
          <select value={i18n.language} onChange={e=>i18n.changeLanguage(e.target.value)}>
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>

        {user && (
          <div className="card glass">
            {isAnonymous ? (
              <div>
                <h3>{t('menu.guestActions')}</h3>
                <button onClick={() => nav('/auth')} disabled={busy}>
                  {t('menu.register')}
                </button>
              </div>
            ) : (
              <div>
                <h3>{t('menu.accountActions')}</h3>
                <button onClick={logout} disabled={busy}>
                  {busy ? t('actions.loggingOut') : t('menu.logout')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}