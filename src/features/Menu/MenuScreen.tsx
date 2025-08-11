import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, updateUserProfile, nationalities, UserProfile } from '../../lib/userApi';
import { calculateAge, isValidDate } from '../../utils/dateUtils';
import styles from './MenuScreen.module.css';

// Define UserProfile interface - This was duplicated multiple times in the changes, consolidating to one definition.
interface UserProfile {
  email: string | null;
  displayName: string | null;
  birthDate: string | null;  // Changed to match API
  gender: 'male'|'female'|'diverse'|null;
  nationality: string | null;
}

export function MenuScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const currentTab = searchParams.get('tab') || 'profile';

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  // Update edit form state - also duplicated, consolidating.
  const [editForm, setEditForm] = useState({
    displayName: '',
    birthDate: '',
    gender: '' as 'male'|'female'|'diverse'|'',
    nationality: ''
  });
  const [message, setMessage] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Load user profile
  useEffect(() => {
    if (user && !user.isAnonymous) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user || user.isAnonymous) return;

    try {
      const profile = await getUserProfile(user.uid);
      // Update profile loading logic - consolidated duplicated sections.
      setUserProfile({
        email: profile?.email || null,
        displayName: profile?.displayName || null,
        birthDate: profile?.birthDate || null,
        gender: profile?.gender || null,
        nationality: profile?.nationality || null
      });
      setEditForm({
        displayName: profile?.displayName || '',
        birthDate: profile?.birthDate ? formatISOToDob(profile.birthDate) : '',
        gender: profile?.gender || '',
        nationality: profile?.nationality || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  // Update save handler - consolidated duplicated sections.
  const handleEditSave = async () => {
    if (!user?.uid) return;

    setProfileLoading(true);
    try {
      const birthDateISO = parseDobInputToISO(editForm.birthDate);

      await updateUserProfile(user.uid, {
        displayName: editForm.displayName || null,
        birthDate: birthDateISO,
        gender: editForm.gender || null,
        nationality: editForm.nationality || null
      });

      setUserProfile(prev => prev ? {
        ...prev,
        displayName: editForm.displayName || null,
        birthDate: birthDateISO,
        gender: editForm.gender || null,
        nationality: editForm.nationality || null
      } : null);

      setIsEditing(false);
      setMessage(t('profile.saved'));
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Fehler beim Speichern');
    } finally {
      setProfileLoading(false);
    }
  };

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
                      // Update profile display section - consolidated duplicated sections.
                      <div className={styles.profileData}>
                        <p><strong>Email:</strong> {userProfile.email}</p>
                        <p><strong>{t('profile.name')}:</strong> {userProfile.displayName}</p>
                        {userProfile.birthDate && (
                          <p>
                            <strong>{t('profile.birthDate')}:</strong> {formatISOToDob(userProfile.birthDate)}
                            {calcAgeFromISO(userProfile.birthDate) && (
                              <span className={styles.age}>
                                ({t('profile.ageYears', { count: calcAgeFromISO(userProfile.birthDate) })})
                              </span>
                            )}
                          </p>
                        )}
                        {userProfile.gender && (
                          <p><strong>{t('profile.gender')}:</strong> {t(`profile.gender_${userProfile.gender}`)}</p>
                        )}
                        {userProfile.nationality && (
                          <p><strong>{t('profile.nationality')}:</strong> {t(`countries.${userProfile.nationality}`)}</p>
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
                        {/* Update edit form UI - consolidated duplicated sections. */}
                        <input
                          type="text"
                          value={editForm.displayName}
                          onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                          placeholder="Name"
                          className={styles.input}
                        />
                        <input
                          type="text"
                          value={editForm.birthDate}
                          onChange={(e) => setEditForm({...editForm, birthDate: e.target.value})}
                          placeholder={t('profile.birthDate_placeholder')}
                          className={styles.input}
                        />
                        <div className={styles.genderGroup}>
                          <label className={styles.label}>{t('profile.gender')}</label>
                          <div className={styles.buttonGroup}>
                            {genderOptions.map(option => (
                              <button
                                key={option.value}
                                type="button"
                                className={`${styles.genderButton} ${editForm.gender === option.value ? styles.active : ''}`}
                                onClick={() => setEditForm({...editForm, gender: option.value})}
                              >
                                {t(option.labelKey)}
                              </button>
                            ))}
                          </div>
                        </div>
                        <select
                          value={editForm.nationality}
                          onChange={(e) => setEditForm({...editForm, nationality: e.target.value})}
                          className={styles.input}
                        >
                          <option value="">{t('profile.nationality')}</option>
                          {nationalityOptions.map(country => (
                            <option key={country} value={country}>
                              {t(`countries.${country}`)}
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
                              setIsEditing(false);
                              setMessage('');
                              // Reset form
                              if (userProfile) {
                                setEditForm({
                                  displayName: userProfile.displayName || '',
                                  birthDate: userProfile.birthDate ? formatISOToDob(userProfile.birthDate) : '',
                                  gender: userProfile.gender || '',
                                  nationality: userProfile.nationality || ''
                                });
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
  );
}