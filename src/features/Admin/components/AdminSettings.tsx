
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminSettings } from '../../../context/AdminSettingsContext'
import styles from './AdminSettings.module.css'

export function AdminSettings() {
  const { t } = useTranslation()
  const { appSettings, updateAppSettings } = useAdminSettings()
  const [savingSettings, setSavingSettings] = useState(false)

  const handleSettingChange = async (key: keyof typeof appSettings, value: any) => {
    setSavingSettings(true)
    try {
      await updateAppSettings({ [key]: value })
      console.log(`✅ ${key} updated to:`, value)
    } catch (error) {
      console.error('Failed to update setting:', error)
    } finally {
      setSavingSettings(false)
    }
  }

  const handleFeatureToggle = async (feature: keyof typeof appSettings.featuresEnabled, enabled: boolean) => {
    await handleSettingChange('featuresEnabled', {
      ...appSettings.featuresEnabled,
      [feature]: enabled
    })
  }

  return (
    <div className={styles.settings}>
      <div className={styles.settingsGrid}>
        
        {/* System Settings */}
        <div className={styles.settingGroup}>
          <h3>🔧 System Settings</h3>
          
          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              <input
                type="checkbox"
                checked={appSettings.maintenanceMode}
                onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxLabel}>🔴 Maintenance Mode</span>
            </label>
            <div className={styles.settingDescription}>
              Blocks all user access except admins
            </div>
          </div>

          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              <input
                type="checkbox"
                checked={appSettings.registrationEnabled}
                onChange={(e) => handleSettingChange('registrationEnabled', e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxLabel}>👥 Registration Enabled</span>
            </label>
            <div className={styles.settingDescription}>
              Allow new users to register
            </div>
          </div>

          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              <input
                type="checkbox"
                checked={appSettings.guestAccessEnabled}
                onChange={(e) => handleSettingChange('guestAccessEnabled', e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxLabel}>🚪 Guest Access</span>
            </label>
            <div className={styles.settingDescription}>
              Allow access without account
            </div>
          </div>
        </div>

        {/* App Limits */}
        <div className={styles.settingGroup}>
          <h3>⚡ App Limits</h3>
          
          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              <span>🎯 Max Tasks per User</span>
              <input
                type="number"
                value={appSettings.maxTasksPerUser}
                onChange={(e) => handleSettingChange('maxTasksPerUser', parseInt(e.target.value))}
                className={styles.numberInput}
                min="1"
                max="1000"
              />
            </label>
          </div>

          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              <span>⏱️ Task Cooldown (minutes)</span>
              <input
                type="number"
                value={appSettings.taskCooldownMinutes}
                onChange={(e) => handleSettingChange('taskCooldownMinutes', parseInt(e.target.value))}
                className={styles.numberInput}
                min="0"
                max="60"
              />
            </label>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className={styles.settingGroup}>
          <h3>🎮 Feature Toggles</h3>
          
          {Object.entries(appSettings.featuresEnabled).map(([feature, enabled]) => (
            <div key={feature} className={styles.settingItem}>
              <label className={styles.settingLabel}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => handleFeatureToggle(feature as any, e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxLabel}>
                  {feature === 'arena' && '⚔️ Arena'}
                  {feature === 'tasks' && '📝 Tasks'}
                  {feature === 'leaderboard' && '🏆 Leaderboard'}
                  {feature === 'suggestions' && '💡 Suggestions'}
                  {feature === 'legends' && '🌟 Legends'}
                </span>
              </label>
            </div>
          ))}
        </div>

        {/* Appearance */}
        <div className={styles.settingGroup}>
          <h3>🎨 Appearance</h3>
          
          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              <span>🌙 App Theme</span>
              <select
                value={appSettings.appTheme}
                onChange={(e) => handleSettingChange('appTheme', e.target.value)}
                className={styles.selectInput}
              >
                <option value="dark">🌙 Dark</option>
                <option value="light">☀️ Light</option>
                <option value="auto">🔄 Auto</option>
              </select>
            </label>
          </div>

          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              <input
                type="checkbox"
                checked={appSettings.leaderboardVisible}
                onChange={(e) => handleSettingChange('leaderboardVisible', e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxLabel}>📊 Show Leaderboard</span>
            </label>
          </div>
        </div>

        {/* Announcements */}
        <div className={styles.settingGroup}>
          <h3>📢 Announcements</h3>
          
          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              <input
                type="checkbox"
                checked={appSettings.announcementActive}
                onChange={(e) => handleSettingChange('announcementActive', e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxLabel}>📢 Show Announcement</span>
            </label>
          </div>

          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              <span>💬 Announcement Text</span>
              <textarea
                value={appSettings.announcementText}
                onChange={(e) => handleSettingChange('announcementText', e.target.value)}
                className={styles.textareaInput}
                placeholder="Enter announcement message..."
                rows={3}
              />
            </label>
          </div>
        </div>
      </div>

      {savingSettings && (
        <div className={styles.savingIndicator}>
          💾 Saving settings...
        </div>
      )}
    </div>
  )
}
