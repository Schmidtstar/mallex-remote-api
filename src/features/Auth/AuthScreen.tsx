
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useNavigate } from 'react-router-dom'
import styles from './AuthScreen.module.css'

export function AuthScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
      navigate('/arena')
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(t('auth.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  async function handleGuestLogin() {
    try {
      setLoading(true)
      await signInAnonymously(auth)
      navigate('/arena')
    } catch (err) {
      console.error('Guest login failed:', err)
      setError(t('auth.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authWrap}>
      <div className={styles.authCard} role="region" aria-label={t('auth.loginTitle')}>
        <h1 className={styles.authTitle}>
          {isLogin ? t('auth.loginTitle') : 'Registrieren'}
        </h1>

        <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
          <div className={styles.field}>
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          {error && <p className={styles.authError} role="alert">{error}</p>}

          <button className={styles.btnPrimary} type="submit" disabled={loading}>
            {loading ? t('auth.loggingIn') : t('auth.login')}
          </button>
        </form>

        <div className={styles.authActions}>
          <button 
            className={styles.btnGhost} 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? t('auth.registerLink') : 'Schon ein Konto? Einloggen'}
          </button>
          <button 
            className={styles.btnGhost} 
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
          >
            {t('auth.guestButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
