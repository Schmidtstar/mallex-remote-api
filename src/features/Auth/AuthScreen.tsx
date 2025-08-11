import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { createUserProfile, nationalities } from '../../lib/userApi'
import { isValidDate } from '../../utils/dateUtils'
import styles from './AuthScreen.module.css'

export function AuthScreen() {
  const { t } = useTranslation()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'diverse' | ''>('')
  const [nationality, setNationality] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validateRegistration = () => {
    if (!email || !password || !displayName) {
      setError('Bitte alle Pflichtfelder ausfüllen')
      return false
    }

    if (birthdate && !isValidDate(birthdate)) {
      setError('Bitte gültiges Geburtsdatum eingeben (TT.MM.JJJJ)')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        if (!validateRegistration()) {
          setLoading(false)
          return
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password)

        // Create user profile in Firestore
        await createUserProfile(userCredential.user.uid, {
          email,
          displayName,
          birthdate: birthdate || undefined,
          gender: gender || undefined,
          nationality: nationality || undefined
        })
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAnonymousLogin = async () => {
    setLoading(true)
    setError('')

    try {
      await signInAnonymously(auth)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={styles.authSection}>
      <h1>{isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}</h1>

      <form onSubmit={handleSubmit} className={styles.authForm}>
        <input
          type="email"
          placeholder={t('auth.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          required
        />
        <input
          type="password"
          placeholder={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          required
        />

        {!isLogin && (
          <>
            <input
              type="text"
              placeholder={t('auth.displayName')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={styles.input}
              required
            />

            <input
              type="text"
              placeholder={t('profile.birthdatePlaceholder')}
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className={styles.input}
            />

            <div className={styles.genderGroup}>
              <label className={styles.label}>{t('profile.gender')}</label>
              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  className={`${styles.genderButton} ${gender === 'male' ? styles.active : ''}`}
                  onClick={() => setGender('male')}
                >
                  {t('profile.gender.male')}
                </button>
                <button
                  type="button"
                  className={`${styles.genderButton} ${gender === 'female' ? styles.active : ''}`}
                  onClick={() => setGender('female')}
                >
                  {t('profile.gender.female')}
                </button>
                <button
                  type="button"
                  className={`${styles.genderButton} ${gender === 'diverse' ? styles.active : ''}`}
                  onClick={() => setGender('diverse')}
                >
                  {t('profile.gender.diverse')}
                </button>
              </div>
            </div>

            <select
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className={styles.select}
            >
              <option value="">{t('profile.nationality')}</option>
              {nationalities.map((nation) => (
                <option key={nation} value={nation}>
                  {nation}
                </option>
              ))}
            </select>
          </>
        )}

        <button type="submit" disabled={loading} className={styles.submitButton}>
          {isLogin ? t('auth.loginButton') : t('auth.registerButton')}
        </button>
      </form>

      <button onClick={() => setIsLogin((prev) => !prev)} disabled={loading} className={styles.toggleButton}>
        {isLogin ? t('auth.registerLink') : t('auth.loginLink')}
      </button>

      <button onClick={handleAnonymousLogin} disabled={loading} className={styles.guestButton}>
        {t('auth.guestButton')}
      </button>

      {(error) && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </section>
  )
}