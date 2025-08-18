import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useNavigate } from 'react-router-dom'
import styles from './AuthScreen.module.css'
import { parseDobInputToISO } from '../../lib/date';
import { genderOptions, nationalityOptions } from '../../lib/options';
import { ensureUserProfile } from '../../lib/userApi';

export function AuthScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('');
  const [dobInput, setDobInput] = useState('');
  const [gender, setGender] = useState<'male'|'female'|'diverse'|''>('');
  const [nationality, setNationality] = useState<string>('');
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        if (userCredential.user) {
          // Save additional profile fields
          await ensureUserProfile(userCredential.user.uid, {
            email: userCredential.user.email ?? undefined,
            displayName: userCredential.user.displayName ?? undefined,
            birthDate: parseDobInputToISO(dobInput) ?? null,
            gender: gender || null,
            nationality: nationality || null,
          });
          // setMessage(t('auth.signUp.success')); // It seems this message is not used in the UI
          navigate('/arena');
        }
      }
      // Navigate after successful auth (both login and register)
      navigate('/arena', { replace: true });
    } catch (err: any) {
      console.error('Auth error:', err)
      // Provide a more specific error message based on the error code
      switch (err.code) {
        case 'auth/invalid-credential':
          setError(t('auth.invalidCredentials'));
          break;
        case 'auth/email-already-in-use':
          setError(t('auth.emailAlreadyInUse'));
          break;
        case 'auth/weak-password':
          setError(t('auth.weakPassword'));
          break;
        default:
          setError(t('auth.error')); // Generic error message
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGuestLogin() {
    try {
      setLoading(true)
      await signInAnonymously(auth)
      navigate('/arena', { replace: true })
    } catch (err) {
      console.error('Guest login failed:', err)
      setError(t('auth.error'))
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordReset() {
    if (!email) {
      setError(t('auth.passwordReset.emailRequired'))
      return
    }
    
    try {
      setLoading(true)
      const { sendPasswordResetEmail } = await import('firebase/auth')
      await sendPasswordResetEmail(auth, email)
      setError(null)
      alert(t('auth.passwordReset.success'))
    } catch (err: any) {
      console.error('Password reset error:', err)
      switch (err.code) {
        case 'auth/user-not-found':
          setError(t('auth.passwordReset.userNotFound'))
          break
        case 'auth/invalid-email':
          setError(t('auth.passwordReset.invalidEmail'))
          break
        default:
          setError(t('auth.error'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authWrap}>
      <div className={styles.authCard} role="region" aria-label={isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}>
        <h1 className={styles.authTitle}>
          {isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
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

          {!isLogin && (
            <>
              <div className={styles.field}>
                <label htmlFor="displayName">{t('auth.displayName')}</label>
                <input
                  id="displayName"
                  type="text"
                  autoComplete="name"
                  placeholder={t('auth.displayName')}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={styles.input}
                  maxLength={50}
                />
              </div>

              <div className={styles.additionalInfo}>
                <h3>{t('auth.additionalInfo')}</h3>

                <input
                  type="text"
                  placeholder={t('profile.birthDate_placeholder')}
                  value={dobInput}
                  onChange={(e) => setDobInput(e.target.value)}
                  className={styles.input}
                />

                <div className={styles.genderGroup}>
                  <label className={styles.label}>{t('profile.gender')}</label>
                  <div className={styles.buttonGroup}>
                    {genderOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        className={`${styles.genderButton} ${gender === option.value ? styles.active : ''}`}
                        onClick={() => setGender(option.value)}
                      >
                        {t(option.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>

                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className={styles.select}
                >
                  <option value="">{t('profile.nationality')}</option>
                  {nationalityOptions.map(country => (
                    <option key={country} value={country}>
                      {t(`countries.${country}`)}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {error && <p className={styles.authError} role="alert">{error}</p>}

          <button className={styles.btnPrimary} type="submit" disabled={loading}>
            {loading ? (isLogin ? t('auth.loggingIn') : t('auth.registering')) : (isLogin ? t('auth.login') : t('auth.register'))}
          </button>
        </form>

        <div className={styles.authActions}>
          <button
            className={styles.btnGhost}
            type="button"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? t('auth.registerLink') : t('auth.loginLink')}
          </button>
          
          {isLogin && (
            <button
              className={styles.btnGhost}
              type="button"
              onClick={handlePasswordReset}
              disabled={loading || !email}
            >
              {t('auth.passwordReset.button')}
            </button>
          )}
          
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