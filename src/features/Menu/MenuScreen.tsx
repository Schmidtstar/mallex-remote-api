import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getUserProfile, updateUserProfile, nationalities, UserProfile } from '../../lib/userApi'
import { calculateAge, isValidDate } from '../../utils/dateUtils'
import styles from './MenuScreen.module.css'

export function MenuScreen() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useTranslation()
  const { user, logout, loading } = useAuth()
  const navigate = useNavigate()

  const currentTab = searchParams.get('tab') || 'profile'

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab })
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/auth', { replace: true })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    displayName: '',
    birthdate: '',
    gender: '' as 'male' | 'female' | 'diverse' | '',
    nationality: ''
  })
  const [message, setMessage] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  // Load user profile
  useEffect(() => {
    if (user && !user.isAnonymous) {
      loadUserProfile()
    }
  }, [user])

  const loadUserProfile = async () => {
    if (!user || user.isAnonymous) return

    try {
      const profile = await getUserProfile(user.uid)
      setUserProfile(profile)
      if (profile) {
        setEditForm({
          displayName: profile.displayName || '',
          birthdate: profile.birthdate || '',
          gender: profile.gender || '',
          nationality: profile.nationality || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleEditSave = async () => {
    if (!user || user.isAnonymous) return

    if (editForm.birthdate && !isValidDate(editForm.birthdate)) {
      setMessage('Bitte gültiges Geburtsdatum eingeben (TT.MM.JJJJ)')
      return
    }

    setProfileLoading(true)
    setMessage('')

    try {
      await updateUserProfile(user.uid, {
        displayName: editForm.displayName,
        birthdate: editForm.birthdate || undefined,
        gender: editForm.gender || undefined,
        nationality: editForm.nationality || undefined
      })

      await loadUserProfile()
      setIsEditing(false)
      setMessage(t('profile.updateSuccess'))
    } catch (error) {
      setMessage('Fehler beim Speichern des Profils')
      console.error('Error updating profile:', error)
    } finally {
      setProfileLoading(false)
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
          <div className={styles.profileSection}>
            <h2>{t('menu.profile')}</h2>
            {user ? (
              <div className={styles.userInfo}>
                <p><strong>{t('menu.email')}:</strong> {user.email || t('menu.anonymous')}</p>

                {!user.isAnonymous && userProfile && (
                  <>
                    {!isEditing ? (
                      <div className={styles.profileData}>
                        {userProfile.displayName && (
                          <p><strong>{t('menu.displayName')}:</strong> {userProfile.displayName}</p>
                        )}

                        {userProfile.birthdate && (
                          <p>
                            <strong>{t('profile.birthdate')}:</strong> {userProfile.birthdate}
                            <span className={styles.age}>
                              ({t('profile.age')}: {calculateAge(userProfile.birthdate)})
                            </span>
                          </p>
                        )}

                        {userProfile.gender && (
                          <p><strong>{t('profile.gender')}:</strong> {t(`profile.gender.${userProfile.gender}`)}</p>
                        )}

                        {userProfile.nationality && (
                          <p><strong>{t('profile.nationality')}:</strong> {userProfile.nationality}</p>
                        )}

                        <button
                          onClick={() => setIsEditing(true)}
                          className={styles.editButton}
                        >
                          {t('profile.edit')}
                        </button>
                      </div>
                    ) : (
                      <div className={styles.editForm}>
                        <input
                          type="text"
                          placeholder={t('menu.displayName')}
                          value={editForm.displayName}
                          onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                          className={styles.input}
                        />

                        <input
                          type="text"
                          placeholder={t('profile.birthdatePlaceholder')}
                          value={editForm.birthdate}
                          onChange={(e) => setEditForm({...editForm, birthdate: e.target.value})}
                          className={styles.input}
                        />

                        <div className={styles.genderGroup}>
                          <label className={styles.label}>{t('profile.gender')}</label>
                          <div className={styles.buttonGroup}>
                            <button
                              type="button"
                              className={`${styles.genderButton} ${editForm.gender === 'male' ? styles.active : ''}`}
                              onClick={() => setEditForm({...editForm, gender: 'male'})}
                            >
                              {t('profile.gender.male')}
                            </button>
                            <button
                              type="button"
                              className={`${styles.genderButton} ${editForm.gender === 'female' ? styles.active : ''}`}
                              onClick={() => setEditForm({...editForm, gender: 'female'})}
                            >
                              {t('profile.gender.female')}
                            </button>
                            <button
                              type="button"
                              className={`${styles.genderButton} ${editForm.gender === 'diverse' ? styles.active : ''}`}
                              onClick={() => setEditForm({...editForm, gender: 'diverse'})}
                            >
                              {t('profile.gender.diverse')}
                            </button>
                          </div>
                        </div>

                        <select
                          value={editForm.nationality}
                          onChange={(e) => setEditForm({...editForm, nationality: e.target.value})}
                          className={styles.select}
                        >
                          <option value="">{t('profile.nationality')}</option>
                          {nationalities.map((nation) => (
                            <option key={nation} value={nation}>
                              {nation}
                            </option>
                          ))}
                        </select>

                        <div className={styles.buttonGroup}>
                          <button
                            onClick={handleEditSave}
                            className={styles.saveButton}
                            disabled={profileLoading}
                          >
                            {profileLoading ? '...' : t('profile.save')}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false)
                              setMessage('')
                              // Reset form
                              if (userProfile) {
                                setEditForm({
                                  displayName: userProfile.displayName || '',
                                  birthdate: userProfile.birthdate || '',
                                  gender: userProfile.gender || '',
                                  nationality: userProfile.nationality || ''
                                })
                              }
                            }}
                            className={styles.cancelButton}
                          >
                            {t('profile.cancel')}
                          </button>
                        </div>

                        {message && (
                          <p className={message.includes('erfolgreich') ? styles.success : styles.error}>
                            {message}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                <button onClick={handleLogout} disabled={loading} className={styles.logoutButton} aria-label={t('menu.logout')}>
                  {t('menu.logout')}
                </button>
              </div>
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