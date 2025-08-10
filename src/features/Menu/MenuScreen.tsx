import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function MenuScreen() {
  const { t, i18n } = useTranslation()
  const { signOutAll } = useAuth()
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
      <div style={{display:'grid', gap:12, maxWidth:420}}>
        <label>{t('menu.language')}: </label>
        <select value={i18n.language} onChange={e=>i18n.changeLanguage(e.target.value)}>
          <option value="de">Deutsch</option>
          <option value="en">English</option>
        </select>

        <button onClick={logout} disabled={busy} style={{marginTop:16}}>
          {busy ? t('actions.loggingOut') : t('actions.logout')}
        </button>
      </div>
    </section>
  )
}
