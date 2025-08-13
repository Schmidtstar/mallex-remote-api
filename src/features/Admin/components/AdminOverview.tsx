
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../context/AuthContext'
import { useAdminSettings } from '../../../context/AdminSettingsContext'
import styles from './AdminOverview.module.css'

export function AdminOverview() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const {
    appSettings,
    userManagement,
    updateAppSettings,
    sendSystemNotification,
    refreshUsers
  } = useAdminSettings()

  const handleSettingChange = async (key: keyof typeof appSettings, value: any) => {
    try {
      await updateAppSettings({ [key]: value })
    } catch (error) {
      console.error('Failed to update setting:', error)
    }
  }

  return (
    <div className={styles.overview}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>👥 Total Users</h3>
          <div className={styles.statValue}>{userManagement.users.length}</div>
        </div>
        <div className={styles.statCard}>
          <h3>🚫 Banned Users</h3>
          <div className={styles.statValue}>{userManagement.bannedUsers.size}</div>
        </div>
        <div className={styles.statCard}>
          <h3>👮 Moderators</h3>
          <div className={styles.statValue}>{userManagement.moderators.size}</div>
        </div>
        <div className={styles.statCard}>
          <h3>🔧 Maintenance</h3>
          <div className={styles.statValue}>
            {appSettings.maintenanceMode ? '🔴 ON' : '🟢 OFF'}
          </div>
        </div>
      </div>

      <div className={styles.quickActions}>
        <h3>Quick Actions</h3>
        <div className={styles.actionButtons}>
          <button
            className={styles.actionButton}
            onClick={() => handleSettingChange('maintenanceMode', !appSettings.maintenanceMode)}
          >
            {appSettings.maintenanceMode ? '🟢 Disable' : '🔴 Enable'} Maintenance
          </button>
          <button
            className={styles.actionButton}
            onClick={() => refreshUsers()}
          >
            🔄 Refresh Users
          </button>
          <button
            className={styles.actionButton}
            onClick={() => sendSystemNotification('all', 'System maintenance scheduled for tonight.')}
          >
            📢 Send Global Notification
          </button>
        </div>
      </div>
    </div>
  )
}
