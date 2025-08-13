import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../../lib/userApi';
import { calcAgeFromISO } from '../../lib/date';
import { nationalityOptions } from '../../lib/options';
import styles from './MenuScreen.module.css';

interface UserProfile {
  email: string | null;
  displayName: string | null;
  birthdate: string | null;
  gender: 'male'|'female'|'diverse'|null;
  nationality: string | null;
}

const genderOptions = [
  { value: 'male', labelKey: 'profile.gender_male' },
  { value: 'female', labelKey: 'profile.gender_female' },
  { value: 'diverse', labelKey: 'profile.gender_diverse' }
];

// Helper functions
const formatISOToDob = (isoDate: string): string => {
  const date = new Date(isoDate);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const parseDobInputToISO = (dobInput: string): string | null => {
  const parts = dobInput.split('.');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toISOString();
};



export function MenuScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
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

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
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
      setUserProfile({
        email: profile?.email || user.email || null,
        displayName: profile?.displayName || null,
        birthdate: profile?.birthdate || null,
        gender: profile?.gender || null,
        nationality: profile?.nationality || null
      });
      setEditForm({
        displayName: profile?.displayName || '',
        birthDate: profile?.birthdate ? formatISOToDob(profile.birthdate) : '',
        gender: profile?.gender || '',
        nationality: profile?.nationality || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleEditSave = async () => {
    if (!user?.uid) return;

    setProfileLoading(true);
    try {
      const birthDateISO = parseDobInputToISO(editForm.birthDate);

      await updateUserProfile(user.uid, {
        displayName: editForm.displayName || undefined,
        birthdate: birthDateISO || undefined,
        gender: editForm.gender || undefined,
        nationality: editForm.nationality || undefined
      });

      setUserProfile(prev => prev ? {
        ...prev,
        displayName: editForm.displayName || null,
        birthdate: birthDateISO,
        gender: editForm.gender || null,
        nationality: editForm.nationality || null
      } : null);

      setIsEditing(false);
      setMessage(t('profile.saved'));
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage(t('common.error'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setMessage('');
    if (userProfile) {
      setEditForm({
        displayName: userProfile.displayName || '',
        birthDate: userProfile.birthdate ? formatISOToDob(userProfile.birthdate) : '',
        gender: userProfile.gender || '',
        nationality: userProfile.nationality || ''
      });
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
        {user && !user.isAnonymous && (
          <button
            className={`${styles.tab} ${currentTab === 'admin' ? styles.active : ''}`}
            onClick={() => handleTabChange('admin')}
          >
            🔧 Admin
          </button>
        )}
      </div>

      <div className={styles.content}>
        {currentTab === 'profile' && (
          <div className={styles.profileSection}>
            <h2>{t('profile.title')}</h2>
            {user ? (
              <div className={styles.userInfo}>
                <p><strong>{t('profile.email')}:</strong> {user.email || t('profile.anonymous')}</p>

                {!user.isAnonymous && userProfile && (
                  <>
                    {!isEditing ? (
                      <div className={styles.profileData}>
                        <p><strong>{t('profile.displayName')}:</strong> {userProfile.displayName || '-'}</p>
                        {userProfile.birthdate && (
                          <p>
                            <strong>{t('profile.birthdate')}:</strong> {formatISOToDob(userProfile.birthdate)}
                            {calcAgeFromISO(userProfile.birthdate) && (
                              <span className={styles.age}>
                                ({t('profile.ageYears', { count: calcAgeFromISO(userProfile.birthdate) || 0 })})
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
                        <input
                          type="text"
                          value={editForm.displayName}
                          onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                          placeholder={t('profile.displayName')}
                          className={styles.input}
                        />
                        <input
                          type="text"
                          value={editForm.birthDate}
                          onChange={(e) => setEditForm({...editForm, birthDate: e.target.value})}
                          placeholder="DD.MM.YYYY"
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
                                onClick={() => setEditForm({...editForm, gender: option.value as any})}
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
                            {profileLoading ? t('common.loading') : t('profile.save')}
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className={styles.cancelButton}
                          >
                            Abbrechen
                          </button>
                        </div>

                        {message && (
                          <p className={message.includes(t('profile.saved')) ? styles.success : styles.error}>
                            {message}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {!user.isAnonymous && userProfile && (
                  <div className={styles.userStats}>
                    <h3>📊 Meine Statistiken</h3>
                    <div className={styles.statsGrid}>
                      <div className={styles.statItem}>
                        <span className={styles.statValue}>🎯</span>
                        <span className={styles.statLabel}>Tasks absolviert</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statValue}>🏆</span>
                        <span className={styles.statLabel}>Arena-Siege</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statValue}>⭐</span>
                        <span className={styles.statLabel}>Legenden-Status</span>
                      </div>
                    </div>
                  </div>
                )}

                {user.isAnonymous && (
                  <p className={styles.guestInfo}>{t('profile.anonymous')}</p>
                )}

                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className={styles.logoutButton}
                >
                  {t('menu.logout')}
                </button>
              </div>
            ) : (
              <div className={styles.guestInfo}>
                <p>{t('profile.anonymous')}</p>
              </div>
            )}
          </div>
        )}

        {currentTab === 'settings' && (
          <div className={styles.settingsSection}>
            <h2>{t('settings.title')}</h2>

            <div className={styles.settingGroup}>
              <h3>{t('settings.language')}</h3>
              <div className={styles.languageButtons}>
                <button
                  className={`${styles.languageButton} ${i18n.language === 'de' ? styles.active : ''}`}
                  onClick={() => changeLanguage('de')}
                >
                  {t('settings.german')}
                </button>
                <button
                  className={`${styles.languageButton} ${i18n.language === 'en' ? styles.active : ''}`}
                  onClick={() => changeLanguage('en')}
                >
                  {t('settings.english')}
                </button>
              </div>
            </div>

            <div className={styles.settingGroup}>
              <h3>{t('settings.theme')}</h3>
              <p>Über MALLEX - Das ultimative Party-Spiel für unvergessliche Abende! Entwickelt von JPS</p>
            </div>
          </div>
        )}

        {currentTab === 'admin' && user && (
          <div className={styles.adminSection}>
            <h2>🔧 Admin Panel</h2>
            
            <div className={styles.adminQuickActions}>
              <button 
                onClick={() => navigate('/admin/dashboard')}
                className={styles.adminButton}
              >
                📊 Dashboard
              </button>
              <button 
                onClick={() => navigate('/admin/tasks')}
                className={styles.adminButton}
              >
                📋 Tasks verwalten
              </button>
              <button 
                onClick={() => navigate('/admin/users')}
                className={styles.adminButton}
              >
                👥 Benutzer verwalten
              </button>
            </div>

            <div className={styles.adminStats}>
              <p><strong>Status:</strong> Admin-Zugriff aktiv</p>
              <p><strong>Berechtigung:</strong> Vollzugriff</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}