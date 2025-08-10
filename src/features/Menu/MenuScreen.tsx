
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function MenuScreen() {
  const { t, i18n } = useTranslation()
  const { signOutAll, isAnonymous, upgradeToEmail, user } = useAuth()
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  const [upgradeEmail, setUpgradeEmail] = useState('')
  const [upgradePassword, setUpgradePassword] = useState('')
  const [upgradeError, setUpgradeError] = useState<string | null>(null)
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)

  async function logout() {
    try {
      setBusy(true)
      await signOutAll()
      nav('/auth', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  async function handleUpgrade(e: React.FormEvent) {
    e.preventDefault()
    setUpgradeError(null)
    setBusy(true)
    try {
      await upgradeToEmail(upgradeEmail, upgradePassword)
      setUpgradeSuccess(true)
      setUpgradeEmail('')
      setUpgradePassword('')
    } catch (error: any) {
      setUpgradeError(error.message || 'auth.upgrade.error.generic')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <h1>{t('menu.title')}</h1>
      <div style={{display:'grid', gap:16, maxWidth:420}}>
        
        <div className="card glass">
          <h3>{t('auth.upgrade.title')}</h3>
          {isAnonymous ? (
            <form onSubmit={handleUpgrade} style={{display:'grid', gap:12}}>
              <input
                type="email"
                placeholder={t('auth.upgrade.email')}
                value={upgradeEmail}
                onChange={(e) => setUpgradeEmail(e.target.value)}
                required
                disabled={busy}
              />
              <input
                type="password"
                placeholder={t('auth.upgrade.password')}
                value={upgradePassword}
                onChange={(e) => setUpgradePassword(e.target.value)}
                required
                disabled={busy}
              />
              <button type="submit" disabled={busy || !upgradeEmail || !upgradePassword}>
                {busy ? t('auth.loading') : t('auth.upgrade.submit')}
              </button>
              {upgradeError && (
                <p style={{color: '#ff8a8a', fontSize: '14px', margin: 0}}>
                  {t(upgradeError)}
                </p>
              )}
              {upgradeSuccess && (
                <p style={{color: '#8aff8a', fontSize: '14px', margin: 0}}>
                  {t('auth.upgrade.success')}
                </p>
              )}
            </form>
          ) : (
            <div>
              <p>Angemeldet als: {user?.email || user?.uid}</p>
              <button onClick={logout} disabled={busy} style={{marginTop:8}}>
                {busy ? t('actions.loggingOut') : t('actions.logout')}
              </button>
            </div>
          )}
        </div>

        <div className="card glass">
          <label>{t('menu.language')}: </label>
          <select value={i18n.language} onChange={e=>i18n.changeLanguage(e.target.value)}>
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </section>
  )
}
